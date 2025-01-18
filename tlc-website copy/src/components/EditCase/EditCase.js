import React, { useState, useEffect, useCallback, useRef  } from "react";
import "../../App.css";
import "./EditCase.css";
import { getAuth } from "firebase/auth";
import { MdEdit } from "../../images/Icons.js";
import { doc, updateDoc, onSnapshot, } from "firebase/firestore";
import { db } from "../../firebase/firebase.js";

const EditCase = ({ pi, fullcase, onBack, onSaveSuccess }) => {
  const auth = getAuth();
  const currentUser = auth.currentUser;
  const userUID = currentUser ? currentUser.uid : null;

  // State to manage form values and edit state
  const [formData, setFormData] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  // const [unsubscribe, setUnsubscribe] = useState(null);
  const listenerAttached = useRef(false);
  const lastAlertedStatus = useRef(null); // Track the last alerted status

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

  const fieldOrder = [
    "name",
    "status",
    "resolution",
    "intervalValue",
    "timeUnit",
    "caseStart",
    "caseEnd",
    "captureTime",
    // "id",
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

  useEffect(() => {
    setFormData(fullcase);
  }, [fullcase]);
 
  // Handle Status changes
  const handleStatusChange = async (newStatus) => {
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
  
      const docRef = doc(db, `raspberrys/${pi}/TimeLapseCase/${fullcase.id}`);
      await updateDoc(docRef, {
        status: newStatus,
        UID: userUID,
        updated_at: formattedNow,
      })
      onSaveSuccess();
      setHasChanges(false); // Disable save button
      setIsEditing(false); // Exit editing mode

      // Update the local state to reflect the status change
      setFormData((prevData) => ({
        ...prevData,
        status: newStatus,
      }));   

      // Start or stop listening based on the status
      if (newStatus === "running") {
        startListening();
      } else {
        stopListening();
      }
      onSaveSuccess();
      if (newStatus !== "aborted")
        {
          alert(`Status updated to ${newStatus}`);
        }
      
    } catch (error) {
      console.error("Error updating status:", error.message);
      alert("Failed to update status. Please try again.");
    }
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
      setIsEditing(false); // Exit editing mode
      alert("Changes saved successfully!");
  
    } catch (error) {
      console.error("Error saving changes:", error.message);
      alert("Failed to save changes. Please try again.");
    }
  };

  const startListening = useCallback(() => {
    if (listenerAttached.current) return; // Avoid reattaching the listener
  
    const docRef = doc(db, `raspberrys/${pi}/TimeLapseCase/${fullcase.id}`);
    const unsubscribe = onSnapshot(docRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        const updatedData = docSnapshot.data();
        setFormData(updatedData);
  
        // Check for status changes and ensure alerts are only shown once
        if (updatedData.status !== lastAlertedStatus.current) {
          if (updatedData.status === "completed") {
            alert("The job has been completed!");
            lastAlertedStatus.current = "completed"; // Update last alerted status
            onSaveSuccess();
          } else if (updatedData.status === "aborted") {
            alert("The job has been aborted!");
            lastAlertedStatus.current = "aborted"; // Update last alerted status
            onSaveSuccess();
          }
        }
      }
    });
  
    // Mark the listener as attached
    listenerAttached.current = true;
  
    // Cleanup function to detach the listener when needed
    return () => {
      unsubscribe();
      listenerAttached.current = false;
    };
  }, [pi, fullcase.id, onSaveSuccess]);
  
  const stopListening = useCallback(() => {
    if (listenerAttached.current) {
      listenerAttached.current = false;
    }
  }, []);  

  useEffect(() => {
    if (formData.status === "running") {
      startListening();
    } else {
      stopListening();
    }

    return () => {
      stopListening();
    };
  }, [formData.status, startListening, stopListening]);
  
  useEffect(() => {
    let cleanupFn;
    if (formData.status === "running") {
      cleanupFn = startListening();
    } else {
      stopListening();
    }
  
    // Cleanup the listener when component unmounts or status changes
    return () => {
      if (cleanupFn) cleanupFn();
    };
  }, [formData.status, startListening, stopListening]);
  
  return (
    <div className="App-background">
      <h1>{fullcase.name}</h1>
      {/* <p>User UID: <strong>{userUID}</strong></p> */}

      {isEditing ? (
        <form className="edit-case-form">
        {fieldOrder.map((key) => (
          <div key={key} className="form-group">
            <label htmlFor={key}>
                <strong>{fieldLabels[key] || key}:</strong>
              </label>
            {key === "resolution" && (
              <>
                <select
                  id={key}
                  name={key}
                  value={formData[key] || ""}
                  onChange={handleChange}
                >
                  <option value="Max_View">12 MP</option>
                  <option value="4K_UHD">4K UHD</option>
                  <option value="2K_UHD">2K UHD</option>
                  <option value="1080p">1080p Full HD</option>
                  <option value="720p">720p HD</option>
                  <option value="SD_480p">480p SD</option>
                </select>
              </>
            )}
            {key === "status" && (
              <>
                <select
                  id={key}
                  name={key}
                  value={formData[key] || ""}
                  onChange={handleChange}
                >
                  <option value="aborted">Stop</option>
                  <option value="running">Start</option>
                  <option value="standby">Save</option>
                </select>
              </>
            )}
            {key === "intervalValue" && (
              <>
                <input
                  id={key}
                  name={key}
                  type="number"
                  value={formData[key] || ""} // Automatically handled as a number
                  onChange={handleChange}
                />
              </>
            )}
            {key === "timeUnit" && (
              <>
                <select
                  id={key}
                  name={key}
                  value={formData[key] || ""}
                  onChange={handleChange}
                >
                  <option value="month">Months</option>
                  <option value="day">Days</option>
                  <option value="hr">Hours</option>
                  <option value="min">Minutes</option>
                  <option value="sec">Seconds</option>
                </select>
              </>
            )}
            {(key === "caseStart" || key === "caseEnd") && (
              <>
                <input
                  id={key}
                  name={key}
                  step="1"
                  type="datetime-local"
                  value={new Date(new Date(formData[key]).getTime() + 8 * 60 * 60 * 1000).toISOString().slice(0, -1)}
                  onChange={handleChange}
                />
              </>
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
            { key !== "resolution" &&
              key !== "status" &&
              key !== "timeUnit" &&
              key !== "caseStart" &&
              key !== "caseEnd" &&
              key !== "intervalValue" &&
              key !== "captureTime" && (
                <>
                  <input
                    id={key}
                    name={key}
                    type="text"
                    value={formData[key] || ""}
                    onChange={handleChange}
                  />
                </>
              )}
          </div>
        ))}
          <div className="form-actions">
            <button
              type="button"
              className="save-button"
              onClick={handleSave}
              disabled={!hasChanges} // Disable save if no changes are made
            >
              Save
            </button>

            <button
              type="button"
              className="back-button"
              onClick={() => setIsEditing(false)}
            >
              Cancel
            </button>
          </div>
      </form>
      
      ) : (
        <div className="view-mode">
          <button
            className="edit-button"
            onClick={() => setIsEditing(true)}
          >
            <MdEdit/>
          </button>

          <p>Status: {fullcase.status}</p>
          <p>
            {fullcase.captureTime ? (() => {
              const [startTime, endTime] = fullcase.captureTime.split("_");
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
          <p>Resolution: {fullcase.resolution}</p>
          <p>Interval Value: {fullcase.intervalValue} {fullcase.timeUnit}</p>
          <p>Capture Job Start: {formatDate(fullcase.caseStart)}</p>
          <p>Capture Job End: &nbsp;{formatDate(fullcase.caseEnd)}</p>

          {/* Run and Stop buttons */}
          <div className="action-buttons">
            <button
              className="run-button"
              onClick={() => handleStatusChange("running")}
              disabled={fullcase.status === "running"}
            >
              Run
            </button>
            <button
              className="stop-button"
              onClick={() => handleStatusChange("aborted")}
              disabled={["aborted", "completed"].includes(fullcase.status)}
            >
              Stop
            </button>
          </div>

          <button
            className="back-button"
            onClick={onBack}
          >
            Back
          </button>
        </div>
      )}
    </div>
  );
};

export default EditCase;