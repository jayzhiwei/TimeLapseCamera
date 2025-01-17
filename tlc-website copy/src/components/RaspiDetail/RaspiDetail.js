import React, { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../firebase/firebase.js";
import "../../App.js";
import "./RaspiDetail.css";
import { FaImage, FaFilm } from "../../images/Icons.js"
import EditCase from "../EditCase/EditCase.js"
import Film from "../Film/Film.js"
import Album from "../Album/Album.js"

const RaspiDetail = ({pi, onBack}) => {
    const [timeLapseCases, setTimeLapseCases] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [showEditPage, setShowEditPage] = useState(false);
    const [showFilmPage, setShowFilmPage] = useState(false); // State to toggle Film component
    const [showAlbumPage, setShowAlbumPage] = useState(false); // State to toggle Album component
    const [selectedCaseId, setSelectedCaseId] = useState(null); // State to store selected case ID

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
    
    const handleSaveSuccess = async () => {
        const timeLapseRef = collection(db, `raspberrys/${pi.serial}/TimeLapseCase`);
        const timeLapseSnapshot = await getDocs(timeLapseRef);
    
        const updatedCases = timeLapseSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));
    
        setTimeLapseCases(updatedCases); // Update the list
        const updatedCase = updatedCases.find((caseItem) => caseItem.id === selectedCaseId.id);
        setSelectedCaseId(updatedCase); // Update the selected case with fresh data
        setShowEditPage(true); // Switch back to view mode
    };    

    if (showEditPage) {
        return (
            <EditCase
            pi={pi.serial}
            fullcase={selectedCaseId}
            onBack={() => setShowEditPage(false)} // Back to RaspiDetail
            onSaveSuccess={handleSaveSuccess} // Pass the callback
            />
        );
    }

    if (showAlbumPage) {
        return (
            <Album
            pi={pi.serial}
            caseId={selectedCaseId.id}
            onBack={() => setShowAlbumPage(false)} // Back to RaspiDetail
            />
        );
        }

    if (showFilmPage) {
        return (
            <Film
            pi={pi.serial}
            caseId={selectedCaseId.id}
            onBack={() => setShowFilmPage(false)} // Back to RaspiDetail
            />
        );
    }

return (
    <div className="App-background">
        <p><strong>{pi.data.NAME}</strong></p>
        <button className="back-button" onClick={onBack}>Back</button>
        {/* <p><strong>Serial Number:</strong> {pi.serial}</p> */}

        {error && <p className="error">{error}</p>}
        {loading && <p>Loading...</p>}

        {timeLapseCases.length > 0 && (
        <div className="timelapse-list">
          {timeLapseCases.map((timeLapseCase) => (
            <div key={timeLapseCase.id} className="timelapse-item"
            onClick={() => {
                setSelectedCaseId(timeLapseCase);
                setShowEditPage(true);
            }}>
                <div className="list-timelapse-item">
                    <h3>Case ID: {timeLapseCase.id}</h3>
                    <div>

                        <button
                        className="Details-button"
                        onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCaseId(timeLapseCase);
                            setShowAlbumPage(true);
                        }}
                        >
                            <FaImage />
                    </button>

                        <button
                        className="Details-button"
                        onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCaseId(timeLapseCase);
                            setShowFilmPage(true);
                        }}
                        >
                            <FaFilm  />
                    </button>
                    </div>
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