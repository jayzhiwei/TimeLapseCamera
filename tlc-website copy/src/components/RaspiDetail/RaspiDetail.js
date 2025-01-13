import React, { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../firebase/firebase.js"; // Update your Firebase paths
import "../../App.js";
import "./RaspiDetail.css";
import { MdEdit } from "../../images/Icons.js"

const RaspiDetail = ({pi, onBack}) => {
    const [timeLapseCases, setTimeLapseCases] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [editingCase, setEditingCase] = useState(null); 
    const [showEditPage, setShowEditPage] = useState(false);
    // const [viewPiDetail, setViewPiDetail] = useState("");

    // **Fetch TimeLapse Cases**
    useEffect(() => {
        const fetchTimeLapseCases = async () => {
        setLoading(true); // Start loading
        try {
            const timeLapseRef = collection(db, `raspberrys/${pi.serial}/TimeLapseCase`);
            const timeLapseSnapshot = await getDocs(timeLapseRef); // Fetch TimeLapse cases

            const cases = timeLapseSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            }));
            setTimeLapseCases(cases); // Store fetched data
            setLoading(false); // Stop loading
        } catch (err) {
            setError("Failed to fetch TimeLapse cases.");
            setLoading(false); // Stop loading
        }
        };
        fetchTimeLapseCases();
    }, [pi.serial]); // Runs whenever `pi.serial` changes

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
        <h1>{pi.NAME}</h1>
        <button className="back-button" onClick={onBack}>Back</button>
        
        <p><strong>Device Name:</strong> {pi.data.NAME}</p>
        <p><strong>Serial Number:</strong> {pi.serial}</p>

        {error && <p className="error">{error}</p>}
        {loading && <p>Loading...</p>}

        {timeLapseCases.length > 0 && (
        <div className="timelapse-list">
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
// }

export default RaspiDetail;