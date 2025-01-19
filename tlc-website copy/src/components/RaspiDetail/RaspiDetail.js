import React, { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../firebase/firebase.js";
import "../../App.css";
import "./RaspiDetail.css";
import { GrLinkPrevious, FaImage, FaFilm, MdOutlineWork } from "../../images/Icons.js"
import CasePreview from "../CasePreview/CasePreview.js"
import CaseAdd from "../CaseAdd/CaseAdd"
import Film from "../Film/Film.js"
import Album from "../Album/Album.js"


const RaspiDetail = ({pi, onBack}) => {
    const [timeLapseCases, setTimeLapseCases] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [showEditPage, setShowEditPage] = useState(false);
    const [showFilmPage, setShowFilmPage] = useState(false); // State to toggle Film component
    const [showAlbumPage, setShowAlbumPage] = useState(false); // State to toggle Album component
    const [showCaseAddPage, setShowCaseAddPage] = useState(false); // State to toggle Album component
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
        return `${day}-${month}-${year} at ${hours}:${minutes}:${seconds}`;
    };
    
    const handleSaveSuccess = async (id = null) => {
        const timeLapseRef = collection(db, `raspberrys/${pi.serial}/TimeLapseCase`);
        const timeLapseSnapshot = await getDocs(timeLapseRef);
    
        const updatedCases = timeLapseSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));
    
        setTimeLapseCases(updatedCases); // Update the list of cases

        if (selectedCaseId) {
            const updatedCase = updatedCases.find((caseItem) => caseItem.id === selectedCaseId.id);
            setSelectedCaseId(updatedCase); // Update the selected case
            setShowEditPage(true); // Stay in edit mode
        } else {
            setShowEditPage(false);
            setShowCaseAddPage(false);
        }
    };
    
    if (showEditPage) {
        return (
            <CasePreview
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
            caseName={selectedCaseId.name}
            onBack={() => setShowAlbumPage(false)} // Back to RaspiDetail
            />
        );
        }

    if (showFilmPage) {
        return (
            <Film
            pi={pi.serial}
            caseId={selectedCaseId.id}
            caseName={selectedCaseId.name}
            onBack={() => setShowFilmPage(false)} // Back to RaspiDetail
            />
        );
    }

    if (showCaseAddPage) {
        return (
            <CaseAdd
            pi={pi.serial}
            onBack={() => setShowCaseAddPage(false)} // Back to RaspiDetail
            onSaveSuccess={handleSaveSuccess}
            />
        );
    }

return (
    <div className="App-background">
        {/* <p><strong>Serial Number:</strong> {pi.serial}</p> */}

        {error && <p className="error">{error}</p>}
        {loading && <p>Loading...</p>}

        {timeLapseCases.length > 0 && (
            <div className="timelapse-list">
                <div className="this-device-details">
                    <button className="back-button" onClick={onBack}>
                        <GrLinkPrevious />
                    </button>

                    <button className="back-button" onClick={() => {
                        setShowCaseAddPage(true);
                        setSelectedCaseId(null);
                    }}>
                        Create new case
                    </button>
                </div>

                <p className="device-name"><strong>{pi.data.NAME}</strong></p>
          {timeLapseCases.map((timeLapseCase) => (
            <div key={timeLapseCase.id} className="timelapse-item"
            onClick={() => {
                setSelectedCaseId(timeLapseCase);
                setShowEditPage(true);
            }}>
                <div className="timelapse-item-header">
                    <h3>{timeLapseCase.name}</h3>
                    <div className="icons">
                        <div className='job-status'>
                            {(() => {
                            const timeLapseStatus = timeLapseCase?.status;
                            if (pi.online) {
                                if (timeLapseStatus === "running") {
                                return (
                                    <div className="busyStatus" style={{ strokeWidth: "15" }}>
                                        <MdOutlineWork />
                                        <span className="device-status">This case is running</span>
                                    </div>
                                );
                                }
                                // If online and no running TimeLapseCase, ready for new case
                                return (
                                <div className="freeStatus">
                                    <MdOutlineWork />
                                    <span className="device-status">This case is on {timeLapseStatus} mode</span>
                                </div>
                                );
                            } else {
                                // Device offline
                                return (
                                <div className="unavailableStatus">
                                    <MdOutlineWork />
                                    <span className="device-status">TimeLapse Case cannot run because this device is offline </span>
                                </div>
                                );
                            }
                            })()}
                        </div>

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

                <div className="timelapse-item-details">
                    <p>Status Updated at: {timeLapseCase.statusUpdated_at}</p>
                    <p>Start: {formatDate(timeLapseCase.caseStart)}</p>
                    <p>End: &nbsp;{formatDate(timeLapseCase.caseEnd)}</p>
                    
                </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
// }

export default RaspiDetail;