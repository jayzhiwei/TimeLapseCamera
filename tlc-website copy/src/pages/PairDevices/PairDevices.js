import React, { useState, useEffect } from "react";
import { collection, query, where, getDocs, doc, updateDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../../firebase/firebase"; // Update with your Firebase configuration paths
import '../../App.css';
import "./PairDevices.css";

function PairDevices() {
    const [ssid, setSsid] = useState("");
    const [country, setCountry] = useState("");
    const [date, setDate] = useState("");
    const [raspberryName, setRaspberryName] = useState("");
    const [availableRaspberries, setAvailableRaspberries] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [currentUser, setCurrentUser] = useState(null);

useEffect(() => {
    
const unsubscribe = onAuthStateChanged(auth, (user) => {
    if (user) {
        setCurrentUser(user);
    } else {
        setCurrentUser(null);
        }
    });
    return () => unsubscribe(); // Cleanup listener on unmount
    },[]);

const handlePair = async (raspberryId) => {
    try {
        setLoading(true);
        setError("");

        // Validate Raspberry Pi ID
        if (!raspberryId) {
            throw new Error("Invalid Raspberry ID: raspberryId is undefined or null.");
        }

        // Validate Current User
        if (!currentUser || !currentUser.uid) {
            throw new Error("Invalid user: currentUser or currentUser.uid is undefined.");
        }

        // Validate Raspberry Pi name
        let finalName = raspberryName.trim();

        if (!finalName) {
            // Query the 'raspberrys' collection for documents matching the current user
            const raspberrysRef = collection(db, "raspberrys");
            const q = query(raspberrysRef, where("UID", "==", currentUser.uid));
            const querySnapshot = await getDocs(q);
        
            // Initialise pairedRaspberrys
            let pairedRaspberrys = [];
        
            // Loop through the results to extract the names
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                if (data && data.NAME) {
                    pairedRaspberrys.push(data.NAME);
                }
            });
        
            console.log("Paired Raspberrys:", pairedRaspberrys);

            // Safely filter existing names and get the maximum index
            const existingNames = pairedRaspberrys
                .filter((name) => typeof name === "string" && name.startsWith("Rasp Cam"))
                .map((name) => parseInt(name.split(" ")[2], 10)) // Extract index
                .filter((index) => !isNaN(index)); // Remove invalid numbers

            // Determine next available index
            const nextIndex = existingNames.length > 0 ? Math.max(...existingNames) + 1 : 1;
            finalName = `Rasp Cam ${nextIndex}`;
        }
        
        // Update the Raspberry Pi document in Firestore
        const raspberryRef = doc(db, "raspberrys", raspberryId);
        await updateDoc(raspberryRef, {
            NAME: finalName,
            UID: currentUser.uid,
            UIDlastModified: serverTimestamp(),
        });

        const formatDateTime = (date) => {
            const year = date.getFullYear();
            const month = (date.getMonth() + 1).toString().padStart(2, "0");
            const day = date.getDate().toString().padStart(2, "0");
            const hours = date.getHours().toString().padStart(2, "0");
            const minutes = date.getMinutes().toString().padStart(2, "0");
            const seconds = date.getSeconds().toString().padStart(2, "0");
            return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
        };

        // Create initial TimeLapseCase template
        const now = new Date();
        const caseStart = new Date(now.getTime() + 30 * 1000); // 30 seconds from now
        const caseEnd = new Date(caseStart.getTime() + 8 * 60 * 1000); // 8 minutes later
        const timelapseRef = doc(db, `raspberrys/${raspberryId}/TimeLapseCase/timelapseTemplate`);
        
        await setDoc(timelapseRef, {
            name:"Template Case",
            status: "standby",
            captureTime: "12:00:00_18:00:00",
            caseStart: formatDateTime(caseStart),
            caseEnd: formatDateTime(caseEnd),
            timeUnit: "sec",
            intervalValue: 20,
            resolution: "720p",
            createdStandby: serverTimestamp(),
        });

        setLoading(false);
        alert("Raspberry Pi paired successfully!");
        window.location.reload();
    } 
    catch (err) {
        console.error("Error pairing Raspberry Pi:", err);
        setError("Failed to pair Raspberry Pi. Please try again.");
        setLoading(false);
    }
};


// Search Firestore for Raspberry Pi devices
const handleSearch = async () => {
    try {
        setLoading(true);
        setError(null);
        
        // Validate SSID and other inputs
        if (!ssid.trim() || !country ) {
            setError("Please provide WiFi Name and Country.");
            setLoading(false);
            return;
        }

        if (!date) {
            setError("Date is required.");
            setLoading(false);
            return;
        }

        // Convert the input date into start and end of the day Unix timestamps
        const startOfDay = Math.floor(new Date(date).setHours(0, 0, 0, 0) / 1000); // Unix timestamp for start of the day
        const endOfDay = Math.floor(new Date(date).setHours(23, 59, 59, 999) / 1000); // Unix timestamp for end of the day

        // Query Firestore for Raspberry Pis with UID null or ""
        const piRef = collection(db, "raspberrys");
        const q = query(piRef, where("UID", "==", null)); // Matches UID that is null or empty
        // console.log(q)
        const querySnapshot = await getDocs(q);
        
        // console.log("Snapshot size:", querySnapshot.size);

        const matchedRaspberries = await Promise.all(
            querySnapshot.docs.map(async (doc) => {
                const raspberryId = doc.id;
                const data = doc.data();

                // Search the 'network' subcollection for matching SSID, country, and time range
                const networkRef = collection(
                    db, "raspberrys", 
                    raspberryId, "network"
                );
                const networkQuery = query(
                    networkRef,
                    where("__name__", "==", ssid.trim()), // Match SSID as the document ID
                    where("Country", "==", country),     // Match country
                );

                const networkSnapshot = await getDocs(networkQuery);

                if (!networkSnapshot.empty) {
                    const networkData = networkSnapshot.docs.map((networkDoc) => {
                        const networkDocData = networkDoc.data();
                        const timeAddSeconds = networkDocData?.timeAdd?.seconds;

                        // Compare timeAdd.seconds with startOfDay and endOfDay
                        if (timeAddSeconds >= startOfDay && timeAddSeconds <= endOfDay) {
                            return {
                                networkId: networkDoc.id,
                                ...networkDocData,
                            };
                        }
                        return null; // Filter out networks not within the date range
                    }).filter(Boolean); // Remove nulls

                    if (networkData.length > 0) {
                        // Return only Raspberry Pis with matching network data within the time range
                        return {
                            ID: raspberryId,
                            ...data,
                            networkData,
                        };
                    }
                }
                return null; // No matching network found
            })
        );

        // Filter out any null results (Raspberry Pis with no matching networks)
        const filteredResults = matchedRaspberries.filter((raspberry) => raspberry !== null);
        setAvailableRaspberries(filteredResults);

        if (filteredResults.length === 0) {
            setError("No Raspberry Pi devices found. Check SSID or Country again.");
        }
        else{
            setError(null);
            console.log(filteredResults);
        }
        setLoading(false);

    } catch (err) {
        console.error("Error searching Firestore:", err);
        setError("Failed to search for Raspberry Pi devices.");
        setLoading(false);
    }
};

  return (
    <div className="App-background">
        <h1>Pair a New Raspberry Pi</h1>

        {error && <p className="error">{error}</p>}

        <label htmlFor="ssid">WiFi Name (Case-Sensitive):</label>
        <input
            id="ssid"
            type="text"
            value={ssid}
            onChange={(e) => setSsid(e.target.value)}
            placeholder="Enter SSID"
        />

        <label htmlFor="country">Country (Raspberry currently at):</label>
        <select id="country" value={country} onChange={(e) => setCountry(e.target.value)}>
            <option value="">Select Country</option>
            <option value="SG">(SG) Singapore</option>
            <option value="UK">(UK) United Kingdom</option>
            <option value="JP">(JP) Japan</option>
        </select>

        <label htmlFor="date">Date (Rapsberry 1st connected to WiFi):</label>
        <input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />

        <button onClick={handleSearch} disabled={loading}>
            {loading ? "Searching..." : "Continue"}
        </button>

        {availableRaspberries.length > 0 && (
            <div className="raspberry-list">
            <h2>Available Raspberry Pi Devices</h2>
            {availableRaspberries.map((raspberry) => (
                <div className="raspberry-item" key={raspberry.ID}>
                <p>Raspberry Cam</p>
                <p>
                    {raspberry.networkData.length > 0 
                        ? (() => {
                            const timeAdd = raspberry.networkData[0].timeAdd;
                            const fullDate = new Date(timeAdd.seconds * 1000); // Convert seconds to milliseconds
                            const nanoseconds = timeAdd.nanoseconds || 0; // Fallback to 0 if nanoseconds is missing
                            const milliseconds = Math.floor(nanoseconds / 1e6); // Convert nanoseconds to milliseconds

                            // Extract AM/PM and custom format
                            const datePart = fullDate.toLocaleString("en-US", {
                                weekday: "long", 
                                year: "numeric", 
                                month: "long", 
                                day: "numeric"
                            });
                            const timePart = fullDate.toLocaleString("en-US", {
                                hour: "2-digit", 
                                minute: "2-digit", 
                                second: "2-digit", 
                                hour12: true // Ensures AM/PM format
                            });

                            return `${datePart} at ${timePart} [${milliseconds.toString().padStart(3, "0")} ms]`;
                        })()
                        : "No Network Data Available"}
                </p>
                <label htmlFor={`name-${raspberry.ID}`}>Name your Raspberry Pi:</label>
                <input
                    id={`name-${raspberry.ID}`}
                    type="text"
                    placeholder="Enter a name"
                    value={raspberryName[raspberry.ID]}
                    onChange={(e) => setRaspberryName(e.target.value)}
                />
                <button onClick={() => {
                    console.log(raspberry.ID)
                    handlePair(raspberry.ID)}}>Pair Now</button>
                </div>
            ))}
            </div>
        )}
    </div>
  );
}

export default PairDevices;