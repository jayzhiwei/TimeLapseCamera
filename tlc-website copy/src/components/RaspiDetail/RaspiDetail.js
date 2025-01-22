import React, { useState, useEffect } from "react";
import { collection, getDocs, doc, deleteDoc } from "firebase/firestore";
import { getStorage, ref, listAll, deleteObject } from "firebase/storage";
import { db } from "../../firebase/firebase.js"; // Update your Firebase paths
import { getAuth } from "firebase/auth";
import "./RaspiDetail.css";
import { GrLinkPrevious, FaImage, FaFilm, MdOutlineWork, MdDelete } from "../../images/Icons.js"
import CasePreview from "../CasePreview/CasePreview.js"
import CaseAdd from "../CaseAdd/CaseAdd"
import Film from "../Film/Film.js"
import Album from "../Album/Album.js"

const RaspiDetail = ({pi, onBack}) => {
    const [timeLapseCases, setTimeLapseCases] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [showPreviewPage, setShowPreviewPage] = useState(false);
    const [showFilmPage, setShowFilmPage] = useState(false); // State to toggle Film component
    const [showAlbumPage, setShowAlbumPage] = useState(false); // State to toggle Album component
    const [showCaseAddPage, setShowCaseAddPage] = useState(false); // State to toggle Album component
    const [selectedCaseId, setSelectedCaseId] = useState(null); // State to store selected case ID
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [caseToDelete, setCaseToDelete] = useState(null);
    const [filteredCases, setFilteredCases] = useState([]);
    const [filters, setFilters] = useState({
                                            name: "",
                                            status: "",
                                            resolution: "",
                                            startDate: "",
                                            endDate: "",
                                        });
    const auth = getAuth();
    const currentUser = auth.currentUser;
    const userUID = currentUser ? currentUser.uid : null;

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
            setFilteredCases(cases); // Set initial filtered cases
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
      
    // const handleSaveSuccess = async (id = null) => {
    //     const timeLapseRef = collection(db, `raspberrys/${pi.serial}/TimeLapseCase`);
    //     const timeLapseSnapshot = await getDocs(timeLapseRef);
    
    //     const updatedCases = timeLapseSnapshot.docs.map((doc) => ({
    //         id: doc.id,
    //         ...doc.data(),
    //     }));
    
    //     setTimeLapseCases(updatedCases); // Update the list of cases

    //     if (selectedCaseId) {
    //         const updatedCase = updatedCases.find((caseItem) => caseItem.id === selectedCaseId.id);
    //         setSelectedCaseId(updatedCase); // Update the selected case
    //         setShowPreviewPage(true); // Stay in edit mode
    //     } else {
    //         setShowPreviewPage(false);
    //         setShowCaseAddPage(false);
    //     }
    // };
    
    if (showPreviewPage) {
        return (
            <CasePreview
            pi={pi.serial}
            fullcase={selectedCaseId}
            onBack={() => setShowPreviewPage(false)} // Back to RaspiDetail
            // onSaveSuccess={handleSaveSuccess} // Pass the callback
            onUpdateCase={(updatedCase) => {
                // Update the specific case in timeLapseCases
                setTimeLapseCases((prevCases) =>
                    prevCases.map((caseItem) =>
                        caseItem.id === updatedCase.id ? updatedCase : caseItem
                    )
                );
                // Update the selected case to reflect changes
                setSelectedCaseId(updatedCase);
            }}
            />
        );
    }

    if (showAlbumPage) {
        return (
            <Album
            pi={pi.serial}
            fullcase={selectedCaseId}
            onBack={() => setShowAlbumPage(false)} // Back to RaspiDetail
            onUpdateCase={(updatedCase) => {
                // Update the specific case in timeLapseCases
                setTimeLapseCases((prevCases) =>
                    prevCases.map((caseItem) =>
                        caseItem.id === updatedCase.id ? updatedCase : caseItem
                    )
                );
                // Update the selected case to reflect changes
                setSelectedCaseId(updatedCase);
            }}
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
                onUpdateCase={(newCase) => {
                    // Append the new case to timeLapseCases
                    setTimeLapseCases((prevCases) => [...prevCases, newCase]);
                    
                    // Optionally, set the newly added case as the selected case
                    setSelectedCaseId(newCase);
                }}
            />
        );
    }    

    const handleDelete = async () => {
        if (!caseToDelete) return;
    
        const storage = getStorage();
        const albumFolderPath = `album/${userUID}/${pi.serial}/${caseToDelete}`;
        const filmsFolderPath = `films/${userUID}/${pi.serial}/${caseToDelete}`;
    
        const deleteFolderContents = async (folderPath) => {
            const folderRef = ref(storage, folderPath);
            try {
                const list = await listAll(folderRef);
    
                // Log the folder contents
                console.log(`Contents of folder ${folderPath}:`, {
                    files: list.items.map((item) => item.fullPath),
                    subfolders: list.prefixes.map((prefix) => prefix.fullPath),
                });
    
                // Delete all files in the folder
                for (const item of list.items) {
                    try {
                        await deleteObject(item);
                        console.log(`Deleted file: ${item.fullPath}`);
                    } catch (err) {
                        console.error(`Failed to delete file: ${item.fullPath}`, err);
                    }
                }
    
                // Recursively delete subfolders
                for (const subFolder of list.prefixes) {
                    await deleteFolderContents(subFolder.fullPath);
                }
            } catch (err) {
                console.error(`Failed to delete folder contents at ${folderPath}:`, err);
                throw err; // Propagate the error to stop further execution
            }
        };
    
        try {
            // Delete album files and subfolders
            await deleteFolderContents(albumFolderPath);
            console.log(`Deleted album folder: ${albumFolderPath}`);
    
            // Delete film files and subfolders
            await deleteFolderContents(filmsFolderPath);
            console.log(`Deleted film folder: ${filmsFolderPath}`);
    
            // Delete the case document from Firestore
            const caseDocRef = doc(db, `raspberrys/${pi.serial}/TimeLapseCase/${caseToDelete}`);
            await deleteDoc(caseDocRef);
    
            // Update local state
            setTimeLapseCases((prevCases) => prevCases.filter((caseItem) => caseItem.id !== caseToDelete));
            alert("Case and associated files deleted successfully.");
        } catch (err) {
            console.error("Error deleting case and files:", err);
            setError("Failed to delete the case and associated files. Please try again.");
        } finally {
            setIsModalOpen(false);
            setCaseToDelete(null);
        }
    };
    
    const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm }) => {
        if (!isOpen) return null;
    
        return (
            <div className="modal-overlay">
            <div className="modal-content">
                <h2>Delete Case</h2>
                <p>Are you sure you want to delete this case? </p>
                <p>This action cannot be undone!</p>
                <p>All associated files, including albums and films stored in Firebase Storage,</p>
                <p>will also be permanently deleted.</p>
                <div className="modal-actions">
                <button onClick={onClose}>Cancel</button>
                <button onClick={onConfirm} className="delete-button">
                    Delete
                </button>
                </div>
            </div>
            </div>
        );
        };

    // Handle Filtering
    const handleFilterChange = (filterType, value) => {
        const updatedFilters = { ...filters, [filterType]: value };
        setFilters(updatedFilters);
    
        const filtered = timeLapseCases.filter((caseItem) => {
            const matchesName = updatedFilters.name
                ? caseItem.name.toLowerCase().includes(updatedFilters.name.toLowerCase())
                : true;
        
            const matchesStatus = updatedFilters.status
                ? caseItem.status === updatedFilters.status
                : true;
        
            const matchesResolution = updatedFilters.resolution
                ? caseItem.resolution === updatedFilters.resolution
                : true;

            const caseStartDate = new Date(caseItem.caseStart);
            const caseEndDate = new Date(caseItem.caseEnd);

            const matchesDateRange =
            (!updatedFilters.startDate || caseStartDate >= new Date(updatedFilters.startDate)) &&
            (!updatedFilters.endDate || caseEndDate <= new Date(updatedFilters.endDate));      
    
          return matchesName && matchesStatus && matchesResolution && matchesDateRange;
        });
    
        setFilteredCases(filtered);
      };
    
return (
    <header>
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
                {/* Filter Input Field */}
                <div className="filter-container">
                    <div class="filter-item">
                        <label for="filter-name">Name:</label>
                        <input
                            type="text"
                            placeholder="Filter by name..."
                            value={filters.name}
                            onChange={(e) => handleFilterChange("name", e.target.value)}
                        />
                    </div>

                    <div class="filter-item">
                        <label for="filter-status">Status:</label>
                        <select
                            value={filters.status || ""}
                            onChange={(e) => handleFilterChange("status", e.target.value)}
                            >
                            <option value="">All</option>
                            <option value="running">Running</option>
                            <option value="standby">Standby</option>
                            <option value="completed">Completed</option>
                            <option value="aborted">Aborted</option>
                        </select>
                    </div>
                    
                    <div class="filter-item">
                        <label for="filter-status">Resolution:</label>
                            <select
                            value={filters.resolution || ""}
                            onChange={(e) => handleFilterChange("resolution", e.target.value)}
                            >
                            <option value="">All</option>
                            <option value="Max_View">12MP (4056x3040)</option>
                            <option value="4K_UHD">4K UHD (3840x2160)</option>
                            <option value="2K_UHD">2K UHD (2560x1440)</option>
                            <option value="1080p">1080p Full HD (1920x1080)</option>
                            <option value="720p">720p HD (1280x720)</option>
                            <option value="SD_480p">480p SD (640x480)</option>
                        </select>
                    </div>

                    <div class="filter-item">
                        <label for="filter-status">Start:</label>
                            <input
                            type="date"
                            value={filters.startDate || ""}
                            onChange={(e) => handleFilterChange("startDate", e.target.value)}
                        />
                    </div>

                    <div class="filter-item">
                        <label for="filter-status">End:</label>
                            <input
                            type="date"
                            value={filters.endDate || ""}
                            onChange={(e) => handleFilterChange("endDate", e.target.value)}
                        />
                    </div>


                </div>

                {filteredCases.map((timeLapseCase) => (
                    <div key={timeLapseCase.id} className="timelapse-item"
                    onClick={() => {
                        setSelectedCaseId(timeLapseCase);
                        setShowPreviewPage(true);
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
                                <button
                                    className="delete-button"
                                    onClick={(e) => {
                                    e.stopPropagation();
                                    setIsModalOpen(true);
                                    setCaseToDelete(timeLapseCase.id);
                                    }}
                                >
                                    <MdDelete />
                                </button>
                            </div>
                        </div>

                        <div className="timelapse-item-details">
                            <p>Status updated at: {timeLapseCase.statusUpdated_at}</p>
                            <p>Start: {formatDate(timeLapseCase.caseStart)}</p>
                            <p>End: &nbsp;{formatDate(timeLapseCase.caseEnd)}</p>
                            <p>Total images: &nbsp;{timeLapseCase.picturesCaptured||"0"}</p>
                        </div>
                    </div>
                ))}
        </div>
      )}
        <DeleteConfirmationModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onConfirm={handleDelete}
        />
    </header>
  );
}
// }

export default RaspiDetail;