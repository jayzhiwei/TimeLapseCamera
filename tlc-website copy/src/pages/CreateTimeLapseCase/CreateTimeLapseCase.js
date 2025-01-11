import React, { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";
import { auth, db } from "../../firebase/firebase"; // Update your Firebase paths
import "../../App.css";
import "./CreateTimeLapseCase.css";

import { MdEdit } from "../../images/Icons.js"

function CreateTimeLapseCase() {
    const [currentUser, setCurrentUser] = useState(null);
    const [raspberryPis, setRaspberryPis] = useState([]);
    const [selectedDevice, setSelectedDevice] = useState(null);
    const [timeLapseCases, setTimeLapseCases] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [editingCase, setEditingCase] = useState(null); // Stores the selected case for editing
    const [showEditPage, setShowEditPage] = useState(false); // Controls the popup visibility


    // Track the logged-in user
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user) {
            setCurrentUser(user);
        } else {
            setCurrentUser(null);
        }
        });

        return () => unsubscribe(); // Cleanup on unmount
    }, []);

    // Fetch all Raspberry Pis belonging to the current user
    useEffect(() => {
        if (!currentUser) return;
        setLoading(true);

        const fetchRaspberryPis = async () => {
        try {
            const raspberryRef = collection(db, "raspberrys");
            const raspberryQuery = query(raspberryRef, where("UID", "==", currentUser.uid));
            const raspberrySnapshot = await getDocs(raspberryQuery);

            const devices = raspberrySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            }));

            setRaspberryPis(devices);
            setLoading(false);
        } catch (err) {
            console.error("Error fetching Raspberry Pis:", err);
            setError("Failed to fetch Raspberry Pi devices.");
            setLoading(false);
        }
        };

        fetchRaspberryPis();
    }, [currentUser]);

    // Fetch TimeLapse cases for a specific Raspberry Pi when clicked
    const handleDeviceClick = async (deviceId) => {
        setLoading(true);
        setSelectedDevice(deviceId);
        try {
        const timeLapseRef = collection(db, `raspberrys/${deviceId}/TimeLapseCase`);
        const timeLapseSnapshot = await getDocs(timeLapseRef);

        const cases = timeLapseSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));
        setTimeLapseCases(cases);
        console.log(cases)
        setLoading(false);
        } catch (err) {
        console.error("Error fetching TimeLapse cases:", err);
        setError("Failed to fetch TimeLapse cases.");
        setLoading(false);
        }
    };

const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0"); // Months are 0-based
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const seconds = date.getSeconds().toString().padStart(2, "0");
    return `${day}/${month}/${year} at ${hours}:${minutes}:${seconds}`;
};

return (
    <div className="App-background">
        <h1>My Raspberry Pi Devices</h1>

        {error && <p className="error">{error}</p>}
        {loading && <p>Loading...</p>}

        {raspberryPis.length > 0 ? (
            <div className="device-list">
                {raspberryPis.map((pi) => (
                    <div key={pi.id} className="device-item">
                    <h2>{pi.NAME || "Unnamed Raspberry Pi"}</h2>
                    <p>Device ID: {pi.id}</p>
                    <button onClick={() => handleDeviceClick(pi.id)}>
                        View TimeLapse Cases
                    </button>
                    </div>
                ))}
            </div>
        ) : (
            !loading && <p>No Raspberry Pi devices found.</p>
        )}

        {selectedDevice && timeLapseCases.length > 0 && (
        <div className="timelapse-list">
          <h2>TimeLapse Cases for {selectedDevice}</h2>
          {timeLapseCases.map((timeLapseCase) => (
            <div key={timeLapseCase.id} className="timelapse-item">
                <div className="edit-timelapse-item">
                    <h3>Case ID: {timeLapseCase.id}</h3>
                    <button
                        className="edit-button"
                        onClick={() => {
                            setEditingCase(timeLapseCase); // Store the selected case
                            setShowEditPage(true); // Open the edit page
                        }}
                    >
                        <MdEdit />
                    </button>
                </div>
                <p>Status: {timeLapseCase.status}</p>
                <p>
                    {timeLapseCase.captureTime
                        ? (() => {
                            const [startTime, endTime] = timeLapseCase.captureTime.split("_");
                            // Helper function to convert time to 12-hour format
                            const formatTime = (time) => {
                            const [hours, minutes, seconds] = time.split(":").map(Number);
                            const period = hours >= 12 ? "PM" : "AM";
                            const formattedHours = hours % 12 || 12; // Convert to 12-hour format
                            return `${formattedHours.toString().padStart(2, "0")}:${minutes
                                .toString()
                                .padStart(2, "0")}:${seconds.toString().padStart(2, "0")} ${period}`;
                            };
                            return `from ${formatTime(startTime)} to ${formatTime(endTime)}`;
                        })()
                        : "Capture Time Not Available"}
                </p>
                <p>Resolution: {timeLapseCase.resolution}</p>
                <p>Interval Value: {timeLapseCase.intervalValue} {timeLapseCase.timeUnit}</p>
                <p>Capture Job Start: {formatDate(timeLapseCase.caseStart)}</p>
                <p>Capture Job End: &nbsp;{formatDate(timeLapseCase.caseEnd)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default CreateTimeLapseCase;