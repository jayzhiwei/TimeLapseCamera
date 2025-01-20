import React, { useState, useEffect } from "react";
import "../../App.css";
import "./CaseEdit.css";
import { updateDoc, doc } from "firebase/firestore";
import { db } from "../../firebase/firebase.js";

const CaseEdit = ({ pi, fullcase, onBack, onSaveSuccess }) => {
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
        ? dontGetSecond(fullcase[key])
        : fullcase[key];
    return acc;
  }, {});

  const [formData, setFormData] = useState(initialFormData);
  const [hasChanges, setHasChanges] = useState(false);

  const fieldOrder = [
    "name",
    "resolution",
    "intervalValue",
    "timeUnit",
    "caseStart",
    "caseEnd",
    "captureTime",
  ];

  const fieldLabels = {
    name: "Name",
    resolution: "Resolution",
    intervalValue: "Interval Value",
    timeUnit: "Time Unit",
    caseStart: "Job Start",
    caseEnd: "Job End",
    captureTime: "Capture Time",
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prevData) => {
      if (name.endsWith("-seconds")) {
        const key = name.replace("-seconds", "");
        const [datePart, timePart] = prevData[key]?.split("T") || [];
        const [hours, minutes] = timePart?.split(":") || ["00", "00"];
        const newSeconds = value;

        return {
          ...prevData,
          [key]: `${datePart}T${hours}:${minutes}:${newSeconds}`,
        };
      }
      return { ...prevData, [name]: value };
    });
  };

  useEffect(() => {
    const isSame = JSON.stringify(formData) === JSON.stringify(initialFormData);
    setHasChanges(!isSame);
  }, [formData, initialFormData]);

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

      const formattedCaseStart = formData.caseStart.replace("T", " ");
      const formattedCaseEnd = formData.caseEnd.replace("T", " ");

      const { id, ...restFormData } = formData;
      const updatedData = {
        ...restFormData,
        caseStart: formattedCaseStart,
        caseEnd: formattedCaseEnd,
        updated_at: formattedNow,
      };

      const docRef = doc(db, `raspberrys/${pi}/TimeLapseCase/${fullcase.id}`);
      await updateDoc(docRef, updatedData);
      onSaveSuccess();
      setHasChanges(false);
      onBack();
      alert("Changes saved successfully!");
    } catch (error) {
      console.error("Error saving changes:", error.message);
      alert("Failed to save changes. Please try again.");
    }
  };

  const renderTimeWithSeconds = (key, label) => {
    const [datePart, timePart] = formData[key]?.split("T") || [];
    const [hours, minutes, seconds = "00"] = timePart?.split(":") || [
      "00",
      "00",
      "00",
    ];

    return (
      <div>
        <div style={{ display: "flex", gap: "5px" }}>
          <input
            type="datetime-local"
            value={`${datePart}T${hours}:${minutes}`}
            onChange={(e) => {
              const [date, time] = e.target.value.split("T");
              const updatedValue = `${date}T${time}:${seconds}`;
              handleChange({ target: { name: key, value: updatedValue } });
            }}
          />
          <select
            value={seconds}
            onChange={(e) => {
              const updatedValue = `${datePart}T${hours}:${minutes}:${e.target.value}`;
              handleChange({ target: { name: key, value: updatedValue } });
            }}
          >
            {Array.from({ length: 60 }, (_, i) => (
              <option key={i} value={i.toString().padStart(2, "0")}>
                {i.toString().padStart(2, "0")}
              </option>
            ))}
          </select>
        </div>
      </div>
    );
  };

  const renderCaptureTimeWithSeconds = () => {
    const [start, end] = formData.captureTime.split("_");
    const [startHours, startMinutes, startSeconds = "00"] = start.split(":");
    const [endHours, endMinutes, endSeconds = "00"] = end.split(":");

    return (
      <div>
        <div>
          <span>From:</span>
          <div style={{ display: "flex", gap: "5px" }}>
            <input
              type="time"
              value={`${startHours}:${startMinutes}`}
              onChange={(e) => {
                const [hours, minutes] = e.target.value.split(":");
                const updatedTime = `${hours}:${minutes}:${startSeconds}_${end}`;
                handleChange({ target: { name: "captureTime", value: updatedTime } });
              }}
            />
            <select
              value={startSeconds}
              onChange={(e) => {
                const updatedTime = `${startHours}:${startMinutes}:${e.target.value}_${end}`;
                handleChange({ target: { name: "captureTime", value: updatedTime } });
              }}
            >
              {Array.from({ length: 60 }, (_, i) => (
                <option key={i} value={i.toString().padStart(2, "0")}>
                  {i.toString().padStart(2, "0")}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <span>To:</span>
          <div style={{ display: "flex", gap: "5px" }}>
            <input
              type="time"
              value={`${endHours}:${endMinutes}`}
              onChange={(e) => {
                const [hours, minutes] = e.target.value.split(":");
                const updatedTime = `${start}_${hours}:${minutes}:${endSeconds}`;
                handleChange({ target: { name: "captureTime", value: updatedTime } });
              }}
            />
            <select
              value={endSeconds}
              onChange={(e) => {
                const updatedTime = `${start}_${endHours}:${endMinutes}:${e.target.value}`;
                handleChange({ target: { name: "captureTime", value: updatedTime } });
              }}
            >
              {Array.from({ length: 60 }, (_, i) => (
                <option key={i} value={i.toString().padStart(2, "0")}>
                  {i.toString().padStart(2, "0")}
                </option>
              ))}
            </select>
          </div>
        </div>
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

            {key === "caseStart" && renderTimeWithSeconds(key, "Job Start")}
            {key === "caseEnd" && renderTimeWithSeconds(key, "Job End")}
            {key === "captureTime" && renderCaptureTimeWithSeconds()}
            {key !== "resolution" &&
             key !== "intervalValue" &&
             key !== "timeUnit" &&
             key !== "caseStart" &&
             key !== "caseEnd" &&
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
          <button type="button" onClick={handleSave} disabled={!hasChanges}>
            Save
          </button>
          <button type="button" onClick={onBack}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default CaseEdit;
