import React, { useState, useEffect } from "react";
import { collection, query, where, getDocs, doc, updateDoc, setDoc, arrayUnion, serverTimestamp } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { db, auth } from "../../firebase/firebase"; // Update with your Firebase configuration paths
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

// Listen to authentication state
useEffect(() => {
const unsubscribe = onAuthStateChanged(auth, (user) => {
    if (user) {
        setCurrentUser(user);
    } else {
        setCurrentUser(null);
    }
    });
return () => unsubscribe(); // Cleanup listener on unmount
}, []);

// Handle pairing logic
const handlePair = async (raspberryId) => {
    try {
        setLoading(true);
        setError("");

        // Validate Raspberry Pi name
        let finalName = raspberryName.trim();
        if (!finalName) {
            // Generate a default name if none is provided
            const userRef = doc(db, "users", currentUser.uid);
            const userDoc = await getDocs(userRef);
            const pairedRaspberrys = userDoc.exists() ? userDoc.data().pairedRaspberrys || [] : [];
            const existingNames = pairedRaspberrys.filter((name) => name.startsWith("Rasp Cam"));
            const nextIndex = existingNames.length + 1;
            finalName = `Rasp Cam ${nextIndex}`;
        }

        // Update the Raspberry Pi document in Firestore
        const raspberryRef = doc(db, "raspberrys", raspberryId);
        await updateDoc(raspberryRef, {
            NAME: finalName,
            UID: currentUser.uid,
            UIDlastModified: serverTimestamp(),
        });

        // Create initial TimeLapseCase template
        const now = new Date();
        const caseStart = new Date(now.getTime() + 30 * 1000); // 30 seconds from now
        const caseEnd = new Date(caseStart.getTime() + 8 * 60 * 1000); // 8 minutes later
        const timelapseRef = doc(db, `raspberrys/${raspberryId}/TimeLapseCase/timelapseTemplate`);
        await setDoc(timelapseRef, {
            status: "standby",
            captureTime: "12:00:00_18:00:00",
            caseStart: caseStart.toISOString(),
            caseEnd: caseEnd.toISOString(),
            timeUnit: "sec",
            intervalValue: 20,
            resolution: "720p",
            createdStandby: serverTimestamp(),
        });

        // Update the user's pairedRaspberrys array
        const userRef = doc(db, "users", currentUser.uid);
        await updateDoc(userRef, {
        pairedRaspberrys: arrayUnion(raspberryId),
        });

        setLoading(false);
        alert("Raspberry Pi paired successfully!");
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
        setError("");

        // Validate SSID and other inputs
        if (!ssid.trim() || !country || !date ) {
            setError("Please provide valid SSID, country, and date.");
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

        // Query Firestore for Raspberry Pis with UID null and matching filters
        const raspberriesRef = collection(db, "raspberrys");
        const raspberryQuery = query(
            raspberriesRef,
            where("UID", "in", [null, ""])
        );

        const raspberrySnapshot = await getDocs(raspberryQuery);

        const results = [];

        for (const raspberryDoc of raspberrySnapshot.docs) {
            const networkRef = collection(db, `raspberrys/${raspberryDoc.id}/network`);
            const networkQuery = query(
                networkRef,
                where("__name__", "==", ssid.trim()), // Match documentId to SSID
                where("Country", "==", country),
                where("timeAdd", ">=", startOfDay),
                where("timeAdd", "<", endOfDay)
            );

            try {
                const networkSnapshot = await getDocs(networkQuery);
                if (networkSnapshot.empty) {
                    console.error(`No matching documents in network for SSID: ${ssid}`);
                } else {
                    networkSnapshot.forEach((networkDoc) => {
                        console.log("Found network document:", networkDoc.data());
                        results.push({
                            raspberryId: raspberryDoc.id,
                            networkId: networkDoc.id,
                            ...raspberryDoc.data(),
                            networkData: networkDoc.data(),
                        });
                    });
                }
            } catch (err) {
                console.error(
                    `Error querying network subcollection for Raspberry ID: ${raspberryDoc.id}, Error:`,
                    err
                );
            }
        }

        setAvailableRaspberries(results);
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

        <label htmlFor="ssid">SSID (Case-Sensitive):</label>
        <input
            id="ssid"
            type="text"
            value={ssid}
            onChange={(e) => setSsid(e.target.value)}
            placeholder="Enter SSID"
        />

        <label htmlFor="country">Country Code:</label>
        <select id="country" value={country} onChange={(e) => setCountry(e.target.value)}>
            <option value="">Select Country</option>
            <option value="SG">Singapore</option>
            <option value="US">United States</option>
            <option value="JP">Japan</option>
            <option value="CN">China</option>
            {/* Add more country options */}
        </select>

        <label htmlFor="date">Date (YYYY-MM-DD):</label>
        <input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />

        <button onClick={handleSearch} disabled={loading}>
            {loading ? "Searching..." : "Continue"}
        </button>

        {availableRaspberries.length > 0 && (
            <div className="raspberry-list">
            <h2>Available Raspberry Pi Devices</h2>
            {availableRaspberries.map((raspberry) => (
                <div className="raspberry-item" key={raspberry.id}>
                <p>Raspberry ID: {raspberry.id}</p>
                <label htmlFor={`name-${raspberry.id}`}>Name your Raspberry Pi:</label>
                <input
                    id={`name-${raspberry.id}`}
                    type="text"
                    placeholder="Enter a name"
                    value={raspberryName}
                    onChange={(e) => setRaspberryName(e.target.value)}
                />
                <button onClick={() => handlePair(raspberry.id)}>Pair Now</button>
                </div>
            ))}
            </div>
        )}
    </div>
  );
}

export default PairDevices;