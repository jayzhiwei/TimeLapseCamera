import React, { useState, useEffect } from "react";
import "../../App.css";
import "./CaseEdit.css";
import { getAuth } from "firebase/auth";
import { updateDoc, doc } from "firebase/firestore";
import { db } from "../../firebase/firebase.js";

const CaseEdit = ({ pi, fullcase, onBack, onSaveSuccess }) => {
    const auth = getAuth();
    const currentUser = auth.currentUser;
    const userUID = currentUser ? currentUser.uid : null;
    const [formData, setFormData] = useState(fullcase);
    const [hasChanges, setHasChanges] = useState(false);

    const fieldOrder = [
        "name",
        "status",
        "resolution",
        "intervalValue",
        "timeUnit",
        "caseStart",
        "caseEnd",
        "captureTime",
    ];

    const fieldLabels = {
        name: "Name",
        status: "Status",
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
        setFormData((prevData) => ({
        ...prevData,
        [name]: value,
        [name]: name === "intervalValue" ? Number(value) : value,
        }));
        setHasChanges(true); // Enable save button when changes are made
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
            .padStart(2, "0")}-${now.getDate().toString().padStart(2, "0")} ${now
            .getHours()
            .toString()
            .padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now
            .getSeconds()
            .toString()
            .padStart(2, "0")}`;
        // Save changes to Firebase
        const { id, ...updatedData } = formData; // Destructure to exclude `id`
        updatedData.UID = userUID;
        updatedData.updated_at = formattedNow;
        // console.log("Updated Data:", updatedData);
        const docRef = doc(db, `raspberrys/${pi}/TimeLapseCase/${fullcase.id}`);
        await updateDoc(docRef, updatedData);
        onSaveSuccess()
        setHasChanges(false); // Disable save button

        onBack(); // Exit editing mode

        alert("Changes saved successfully!");
    
        } catch (error) {
        console.error("Error saving changes:", error.message);
        alert("Failed to save changes. Please try again.");
        }
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
                    <option value="Max_View">12 MP</option>
                    <option value="4K_UHD">4K UHD</option>
                    <option value="2K_UHD">2K UHD</option>
                    <option value="1080p">1080p Full HD</option>
                    <option value="720p">720p HD</option>
                    <option value="SD_480p">480p SD</option>
                </select>
                )}
                {key === "status" && (
                <select id={key} name={key} value={formData[key] || ""} onChange={handleChange}>
                    <option value="aborted">Stop</option>
                    <option value="running">Start</option>
                    <option value="standby">Save</option>
                </select>
                )}
                {key === "intervalValue" && (
                <input
                    id={key}
                    name={key}
                    type="number"
                    value={formData[key] || ""}
                    onChange={handleChange}
                />
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
                <input
                    id={key}
                    name={key}
                    type="datetime-local"
                    value={new Date(new Date(formData[key]).getTime() + 8 * 60 * 60 * 1000)
                    .toISOString()
                    .slice(0, -1)}
                    onChange={handleChange}
                />
                )}
                {key === "captureTime" && (
                <>
                    <span> from </span>
                    <input
                    id="captureStart"
                    name="captureStart"
                    type="time"
                    value={formData[key]?.split("_")[0] || ""}
                    onChange={(e) =>
                        handleChange({
                        target: {
                            name: "captureTime",
                            value: `${e.target.value}_${formData[key]?.split("_")[1] || ""}`,
                        },
                        })
                    }
                    />
                    <span> to </span>
                    <input
                    id="captureEnd"
                    name="captureEnd"
                    type="time"
                    value={formData[key]?.split("_")[1] || ""}
                    onChange={(e) =>
                        handleChange({
                        target: {
                            name: "captureTime",
                            value: `${formData[key]?.split("_")[0] || ""}_${e.target.value}`,
                        },
                        })
                    }
                    />
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
                onClick={(e) => {
                    e.preventDefault();
                    onBack();
                }}
            >
                Cancel
            </button>
            </div>
        </form>
        </div>
    );
};

export default CaseEdit;
