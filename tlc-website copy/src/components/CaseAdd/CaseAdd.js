import React, { useState, useEffect, useMemo } from "react";
import "../../App.css";
// import { getAuth } from "firebase/auth";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../../firebase/firebase.js";

const CaseAdd = ({ pi, allCases, onBack, onUpdateCase }) => {
    // const auth = getAuth();
    // const currentUser = auth.currentUser;
    // const userUID = currentUser ? currentUser.uid : null;
    const [ canRun, setCanRun ] = useState(true);
    // Helper: Format DateTime for UTC storage
    const toUTC = (localTime) => {
        const localDate = new Date(localTime);
        return new Date(localDate.getTime() - localDate.getTimezoneOffset() * 60 * 1000).toISOString();
    };

    // Helper: Format DateTime for Local Display
    const toLocalTime = (utcTime) => {
        const date = new Date(utcTime);
        const localDate = new Date(date.getTime() + date.getTimezoneOffset() * 60 * 1000);
        const year = localDate.getFullYear();
        const month = (localDate.getMonth() + 1).toString().padStart(2, "0");
        const day = localDate.getDate().toString().padStart(2, "0");
        const hours = localDate.getHours().toString().padStart(2, "0");
        const minutes = localDate.getMinutes().toString().padStart(2, "0");
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    useEffect(() => {
        const checkTimeLapseCasesStatus = async () => {
            for(let i = 0; i < allCases.length; i++){
            const item = allCases[i]
            // console.log(item.id)
            if(item.status === "running"){
                setCanRun(false);
                break;
            }
            }
        };
        checkTimeLapseCasesStatus();
    }, []);

    // Memoized Initial Form Data
    const initialFormData = useMemo(() => {
        const now = new Date();
        const caseStart = new Date(now.getTime() + 30 * 1000); // Start in 30 seconds
        const caseEnd = new Date(caseStart.getTime() + 8 * 60 * 1000); // End 8 minutes later
        
        return {
        name: "",
        status: "standby",
        resolution: "1080p",
        intervalValue: 5,
        timeUnit: "sec",
        caseStart:toUTC(caseStart),
        caseEnd: toUTC(caseEnd),
        captureTime: "00:00:00_23:59:59",
        createdStandby: serverTimestamp(),
        };
        
    }, []);

    const [formData, setFormData] = useState(initialFormData);
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
          [name]: name === "intervalValue" ? Number(value) : value,
      }));
    };

    // Detect changes and validate `name` field
    useEffect(() => {
        const isChanged = JSON.stringify(formData) !== JSON.stringify(initialFormData);
        const isNameValid = formData.name.trim() !== ""; // Name cannot be empty
        setHasChanges(isChanged && isNameValid);
    }, [formData, initialFormData]);

    // Handle Save
    const handleSave = async () => {
        if (!formData.name) {
            alert("Name is required.");
            return;
        }
    
        try {
            const now = new Date();
            const formattedNow = `${now.getFullYear()}-${(now.getMonth() + 1)
              .toString()
              .padStart(2, "0")}-${now.getDate().toString().padStart(2, "0")} ${now.getHours().toString()
              .padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString()
              .padStart(2, "0")}`;

            // Preprocess the `caseStart` and `caseEnd` fields
            const formattedCaseStart = formData.caseStart.replace("T", " ").replace(/\.\d+Z$/, "");
            const formattedCaseEnd = formData.caseEnd.replace("T", " ").replace(/\.\d+Z$/, "");

            // Prepare data for Firebase
            const newCase = {
                ...formData,
                caseStart: formattedCaseStart, // Use the formatted value
                caseEnd: formattedCaseEnd, // Use the formatted value
                // UID: userUID,
                createdStandby: serverTimestamp(),
                updated_at: formattedNow,
                statusUpdated_at: null
            };

            const timeLapseRef = collection(db, `raspberrys/${pi.serial}/TimeLapseCase`);

            const docRef = await addDoc(timeLapseRef, newCase);
            // Create the complete case object with the ID
            const completeCase = { id: docRef.id, ...newCase };
            onUpdateCase(completeCase);

            // console.log(completeCase)

            alert("New case added successfully!");
            onBack(); // Return to RaspiDetail
        } catch (error) {
            console.error("Error adding new case:", error.message);
            alert("Failed to add new case. Please try again.");
        }
    };

console.log(pi.serial)

    // Helper: Render Time with Seconds
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
            value={hoursMinutes}
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
            value={seconds || "00"}
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
    console.log(formData)
    // console.log(pi.online)

    return (
        <div className="App-background">
            <form className="edit-case-form">
                {fieldOrder.map((key) => (
                    <div key={key} className="form-group">
                        <label htmlFor={key}>
                            <strong>{fieldLabels[key] || key}:</strong>
                        </label>
                        {key === "resolution" && (
                            <select id={key} name={key} value={formData[key]} onChange={handleChange}>
                                <option value="Max_View">12MP (4056x3040)</option>
                                <option value="4K_UHD">4K UHD (3840x2160)</option>
                                <option value="2K_UHD">2K UHD (2560x1440)</option>
                                <option value="1080p">1080p Full HD (1920x1080)</option>
                                <option value="720p">720p HD (1280x720)</option>
                                <option value="SD_480p">480p SD (640x480)</option>
                            </select>
                        )}
                        
                        {key === "status" && (
                            <select 
                                id={key} 
                                name={key} 
                                value={formData[key]} 
                                onChange={handleChange}
                                disabled={pi.online === false || canRun === false}
                            >
                            {/* <option value="aborted">Stop</option> */}
                            <option value="running" >
                                Start
                            </option>
                            <option value="standby">Standby</option>
                        </select>
                        )}

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
                            <select id={key} name={key} value={formData[key]} onChange={handleChange}>
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
                            value={toLocalTime(formData[key])} // Convert UTC to Local
                            onChange={(e) =>
                                handleChange({
                                target: {
                                    name: key,
                                    value: toUTC(e.target.value), // Convert Local to UTC
                                },
                                })
                            }
                            />
                            {/* Dropdown for seconds */}
                            <select
                            id={`${key}-seconds`}
                            name={`${key}-seconds`}
                            value={(() => {
                                // Parse the ISO string (formData[key])
                                const timePart = formData[key]?.split("T")[1]?.split(".")[0]; // Extract time without milliseconds or Z
                                const seconds = timePart?.split(":")[2]; // Extract seconds
                                return seconds || "00"; // Default to "00" if not available
                            })()}
                            onChange={(e) => {
                                // Parse and reconstruct the updated datetime string
                                const [datePart, timePart] = formData[key]?.split("T") || [];
                                const [hours, minutes] = timePart?.split(":") || ["00", "00"];
                                const newSeconds = e.target.value;

                                // Reconstruct the ISO string
                                const updatedTime = `${datePart}T${hours}:${minutes}:${newSeconds}.000Z`;

                                // Update formData with the new time
                                handleChange({
                                target: {
                                    name: key,
                                    value: updatedTime, // Store the updated ISO string
                                },
                                });
                            }}
                            >
                            {Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, "0")).map((sec) => (
                                <option key={sec} value={sec}>
                                {sec}
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
                        key !== "intervalValue"&&
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
                    <button type="button" className="back-button" onClick={onBack}>
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CaseAdd;
