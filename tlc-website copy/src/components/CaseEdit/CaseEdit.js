import React, { useState, useEffect } from "react";
import "../../App.css";
import "./CaseEdit.css";
// import { getAuth } from "firebase/auth";
import { updateDoc, doc } from "firebase/firestore";
import { db } from "../../firebase/firebase.js";

const CaseEdit = ({ pi, fullcase, onBack, onSaveSuccess }) => {
    // const auth = getAuth();
    // const currentUser = auth.currentUser;
    // const userUID = currentUser ? currentUser.uid : null;

    // Helper: Format DateTime for Local Display
    const dontGetSecond = (utcTime) => {
        const date = new Date(utcTime);
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, "0");
        const day = date.getDate().toString().padStart(2, "0");
        const hours = date.getHours().toString().padStart(2, "0");
        const minutes = date.getMinutes().toString().padStart(2, "0");
        const seconds = date.getSeconds().toString().padStart(2, "0");
        return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
    };

    const initialFormData = Object.keys(fullcase).reduce((acc, key) => {
        acc[key] =
            key === "caseStart" || key === "caseEnd"
            ? dontGetSecond(fullcase[key]) // Format datetime fields
            : fullcase[key]; // Keep other fields as is
        return acc;
        }, {});
        
    const [formData, setFormData] = useState(initialFormData);
    const [hasChanges, setHasChanges] = useState(false);

    const fieldOrder = [
        "name",
        // "status",
        "resolution",
        "intervalValue",
        "timeUnit",
        "caseStart",
        "caseEnd",
        "captureTime",
    ];

    const fieldLabels = {
        name: "Name",
        // status: "Status",
        resolution: "Resolution",
        intervalValue: "Interval Value",
        timeUnit: "Time Unit",
        caseStart: "Job Start",
        caseEnd: "Job End",
        captureTime: "Capture Time",
    };

    // Handle input changes
    const handleChange = (e) => {
        const { name, value } = e.target;
    
        setFormData((prevData) => {
            if (name.endsWith("-seconds")) {
                const key = name.replace("-seconds", ""); // caseStart or caseEnd
                const [datePart, timePart] = prevData[key]?.split("T") || [];
                const [hours, minutes] = timePart?.split(":") || ["00", "00"];
                const newSeconds = value;
    
                // Reconstruct the datetime in local time
                return {
                    ...prevData,
                    [key]: `${datePart}T${hours}:${minutes}:${newSeconds}`, // Do not append `.000Z`
                };
            }
    
            return { ...prevData, [name]: value }; // Handle other fields
        });
    };
    

    // Check if values have changed
    useEffect(() => {
        const isSame = JSON.stringify(formData) === JSON.stringify(fullcase);
        setHasChanges(!isSame);
    }, [formData, fullcase]);

    // Upload changes
    const handleSave = async () => {
        try {
        const now = new Date();
        const formattedNow = `${now.getFullYear()}-${(now.getMonth() + 1)
            .toString()
            .padStart(2, "0")}-${now.getDate().toString().padStart(2, "0")} ${now.getHours().toString()
            .padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString()
            .padStart(2, "0")}`;

        const formattedCaseStart = formData.caseStart.replace("T", " ").replace(/\.\d+Z$/, "");
        const formattedCaseEnd = formData.caseEnd.replace("T", " ").replace(/\.\d+Z$/, "");

        // Format time fields
        const { id, ...restFormData } = formData; // Exclude `id` from formData
        const updatedData = {
        ...restFormData, // Spread the rest of formData without `id`
        caseStart: formattedCaseStart,
        caseEnd: formattedCaseEnd,
        updated_at: formattedNow,
        };
        
        const docRef = doc(db, `raspberrys/${pi}/TimeLapseCase/${fullcase.id}`);
        await updateDoc(docRef, updatedData);
        onSaveSuccess();
        setHasChanges(false); // Disable save button
        onBack(); // Exit editing mode
        alert("Changes saved successfully!");
        
    } catch (error) {
        console.error("Error saving changes:", error.message);
        alert("Failed to save changes. Please try again.");
    }
  };

    // Helper function to render time and seconds input CaptureStart and End Time
    const renderTimeWithSeconds = (key, timeKey, label) => {
        const [hoursMinutes, seconds] = (formData[key]?.split("_")[timeKey === "captureStart" ? 0 : 1] || "")
        .split(":")
        .reduce(
            (acc, val, index) => (index < 2 ? [acc[0] + (acc[0] ? ":" : "") + val, acc[1]] : [acc[0], val]),
            ["", "00"]
        );
    
        return (
        <div>
            <span>{label}</span>
            <input
            id={timeKey}
            name={timeKey}
            type="time"
            // step="1"
            value={hoursMinutes} // Show HH:mm
            onChange={(e) =>
                handleChange({
                target: {
                    name: key,
                    value:
                    timeKey === "captureStart"
                        ? `${e.target.value}:${seconds || "00"}_${formData[key]?.split("_")[1] || ""}`
                        : `${formData[key]?.split("_")[0] || ""}_${e.target.value}:${seconds || "00"}`,
                },
                })
            }
            />
            <select
            id={`${timeKey}-seconds`}
            name={`${timeKey}-seconds`}
            value={seconds || "00"} // Show seconds
            onChange={(e) =>
                handleChange({
                target: {
                    name: key,
                    value:
                    timeKey === "captureStart"
                        ? `${hoursMinutes}:${e.target.value}_${formData[key]?.split("_")[1] || ""}`
                        : `${formData[key]?.split("_")[0] || ""}_${hoursMinutes}:${e.target.value}`,
                },
                })
            }
            >
            {Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, "0")).map((sec) => (
                <option key={sec} value={sec}>
                {sec}
                </option>
            ))}
            </select>
        </div>
        );
    };  

    return (
        <div className="App-background">
        <form className="edit-case-form">
            {fieldOrder.map((key) => (
            <div key={key} className="form-group">
                <label htmlFor={key}>
                <strong>{fieldLabels[key] || key}:</strong>
                </label>
                {key === "resolution" && (
                <select id={key} name={key} value={formData[key] || ""} onChange={handleChange}>
                    <option value="Max_View">12MP (4056x3040)</option>
                    <option value="4K_UHD">4K UHD (3840x2160)</option>
                    <option value="2K_UHD">2K UHD (2560x1440)</option>
                    <option value="1080p">1080p Full HD (1920x1080)</option>
                    <option value="720p">720p HD (1280x720)</option>
                    <option value="SD_480p">480p SD (640x480)</option>
                </select>
                )}
                {/* {key === "status" && (
                <select id={key} name={key} value={formData[key] || ""} onChange={handleChange}>
                    <option value="aborted">Stop</option>
                    <option value="running">Start</option>
                    <option value="standby">Save</option>
                </select>
                )} */}
                {key === "intervalValue" && (
                    <select
                        id={key}
                        name={key}
                        value={formData[key]}
                        onChange={handleChange}
                    >
                        {Array.from({ length: 60 }, (_, i) => i + 1).map((num) => (
                        <option key={num} value={num}>
                            {num}
                        </option>
                        ))}
                    </select>
                )}

                {key === "timeUnit" && (
                <select id={key} name={key} value={formData[key] || ""} onChange={handleChange}>
                    <option value="month">Months</option>
                    <option value="day">Days</option>
                    <option value="hr">Hours</option>
                    <option value="min">Minutes</option>
                    <option value="sec">Seconds</option>
                </select>
                )}

                {(key === "caseStart" || key === "caseEnd") && (
                        <div>
                            {/* Input for date and time */}
                            <input
                            id={key}
                            name={key}
                            type="datetime-local"
                            value={formData[key]?.slice(0, 16)}
                            onChange={(e) =>
                                handleChange({
                                    target: { name: key, value: `${e.target.value}` },
                                })
                            }
                            />
                            {/* Dropdown for seconds */}
                            <select
                                id={`${key}-seconds`}
                                name={`${key}-seconds`}
                                value={(() => {
                                    const timePart = formData[key]?.split("T")[1];
                                    const seconds = timePart?.split(":")[2];
                                    return seconds || "00";
                                })()}
                                onChange={(e) => {
                                    handleChange({ target: { name: `${key}-seconds`, value: e.target.value } });
                                }}
                            >
                                {Array.from({ length: 60 }, (_, i) => (
                                    <option key={i} value={i.toString().padStart(2, "0")}>
                                        {i.toString().padStart(2, "0")}
                                    </option>
                                ))}
                            </select>


                        </div>
                        )}

                {key === "captureTime" && (
                <>
                    {renderTimeWithSeconds(key, "captureStart", "From:")}
                    {renderTimeWithSeconds(key, "captureEnd", "To:")}
                </>
                )}

                {key !== "resolution" &&
                key !== "status" &&
                key !== "timeUnit" &&
                key !== "caseStart" &&
                key !== "caseEnd" &&
                key !== "intervalValue" &&
                key !== "captureTime" && (
                    <input
                    id={key}
                    name={key}
                    type="text"
                    value={formData[key] || ""}
                    onChange={handleChange}
                    />
                )}
            </div>
            ))}
            <div className="form-actions">
            <button
                type="button"
                className="save-button"
                onClick={handleSave}
                disabled={!hasChanges}
            >
                Save
            </button>
            <button
                type="button"
                className="back-button"
                onClick={() => onBack()}
            >
                Cancel
            </button>
            </div>
        </form>
        </div>
    );
};

export default CaseEdit;
