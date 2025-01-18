import React, { useState, useEffect, useMemo } from "react";
import "../../App.css";
// import { getAuth } from "firebase/auth";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../../firebase/firebase.js";

const CaseAdd = ({ pi, onBack, onSaveSuccess }) => {
    // const auth = getAuth();
    // const currentUser = auth.currentUser;
    // const userUID = currentUser ? currentUser.uid : null;

    const formatDateTime = (date) => {
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const day = date.getDate().toString().padStart(2, "0");
      const hours = date.getHours().toString().padStart(2, "0");
      const minutes = date.getMinutes().toString().padStart(2, "0");
      const seconds = date.getSeconds().toString().padStart(2, "0");
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  };

    const now = useMemo(() => new Date(), []);
    const caseStart = useMemo(() => new Date(now.getTime() + 30 * 1000), [now]);
    const caseEnd = useMemo(() => new Date(caseStart.getTime() + 8 * 60 * 1000), [caseStart]);

    const initialFormData = useMemo(() => ({
      name: "",
      status: "standby",
      resolution: "1080p",
      intervalValue: 5,
      timeUnit: "sec",
      caseStart: formatDateTime(caseStart),
      caseEnd: formatDateTime(caseEnd),
      captureTime: "00:00:00_23:59:59",
      createdStandby: serverTimestamp(),
    }), [caseStart, caseEnd]);

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
              .padStart(2, "0")}-${now.getDate().toString().padStart(2, "0")} ${now
              .getHours()
              .toString()
              .padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now
              .getSeconds()
              .toString()
              .padStart(2, "0")}`;

            // Prepare data for Firebase
            const newCase = {
                ...formData,
                // UID: userUID,
                createdStandby: serverTimestamp(),
                updated_at: formattedNow,
            };

            const timeLapseRef = collection(db, `raspberrys/${pi}/TimeLapseCase`);
            await addDoc(timeLapseRef, newCase);
            onSaveSuccess()
            alert("New case added successfully!");
            onBack(); // Return to RaspiDetail
        } catch (error) {
            console.error("Error adding new case:", error.message);
            alert("Failed to add new case. Please try again.");
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
                            <select id={key} name={key} value={formData[key]} onChange={handleChange}>
                                <option value="Max_View">12 MP</option>
                                <option value="4K_UHD">4K UHD</option>
                                <option value="2K_UHD">2K UHD</option>
                                <option value="1080p">1080p Full HD</option>
                                <option value="720p">720p HD</option>
                                <option value="SD_480p">480p SD</option>
                            </select>
                        )}
                        {key === "status" && (
                            <select id={key} name={key} value={formData[key]} onChange={handleChange}>
                                {/* <option value="aborted">Stop</option> */}
                                <option value="running">Start</option>
                                <option value="standby">Standby</option>
                            </select>
                        )}
                        {key === "intervalValue" && (
                            <input
                                id={key}
                                name={key}
                                type="number"
                                value={formData[key]}
                                onChange={handleChange}
                            />
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
                            <input
                                id={key}
                                name={key}
                                type="datetime-local"
                                value={formData[key]}
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
                            step="1"
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
                            step="1"
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
