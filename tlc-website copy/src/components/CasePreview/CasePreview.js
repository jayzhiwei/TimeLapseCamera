import React, { useState, useEffect, } from "react";
import "../../App.css";
import "./CasePreview.css";
import { getAuth } from "firebase/auth";
import { MdEdit } from "../../images/Icons.js";
import { doc, updateDoc,  } from "firebase/firestore";
import { db } from "../../firebase/firebase.js";
import CaseEdit from "../CaseEdit/CaseEdit"; // Import the CaseEdit component

const CasePreview = ({ pi, fullcase, onBack, onSaveSuccess }) => {
    const auth = getAuth();
    const currentUser = auth.currentUser;
    const userUID = currentUser ? currentUser.uid : null;

    const [formData, setFormData] = useState({});
    const [isEditing, setIsEditing] = useState(false);
    // const listenerAttached = useRef(false);
    // const lastAlertedStatus = useRef(null); // Track the last alerted status
  
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const day = date.getDate().toString().padStart(2, "0");
        const month = (date.getMonth() + 1).toString().padStart(2, "0");
        const year = date.getFullYear();
        const hours = date.getHours().toString().padStart(2, "0");
        const minutes = date.getMinutes().toString().padStart(2, "0");
        const seconds = date.getSeconds().toString().padStart(2, "0");
        return `${day}/${month}/${year} at ${hours}:${minutes}:${seconds}`;
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

          // If the new status is "aborted", confirm with the user
      if (newStatus === "aborted") {
        const userConfirmed = window.confirm(
          "Are you sure you want to abort this job?"
        );
        if (!userConfirmed) {
          return; // Exit without making changes if the user cancels
        }
      }
  
      const docRef = doc(db, `raspberrys/${pi}/TimeLapseCase/${fullcase.id}`);
      await updateDoc(docRef, {
        status: newStatus,
        UID: userUID,
        updated_at: formattedNow,
      })
      onSaveSuccess();
      setIsEditing(false); // Exit editing mode

      // Update the local state to reflect the status change
      setFormData((prevData) => ({
        ...prevData,
        status: newStatus,
      }));   

      // // Start or stop listening based on the status
      // if (newStatus === "running") {
      //   startListening();
      // } else {
      //   stopListening();
      // }
      if (newStatus !== "aborted")
        {
          alert(`Status updated to ${newStatus}`);
        }
      
    } catch (error) {
      console.error("Error updating status:", error.message);
      alert("Failed to update status. Please try again.");
    }
  };

  // const startListening = useCallback(() => {
  //   if (listenerAttached.current) return; // Prevent multiple listeners
  
  //   const docRef = doc(db, `raspberrys/${pi}/TimeLapseCase/${fullcase.id}`);
  //   const unsubscribe = onSnapshot(docRef, (docSnapshot) => {
  //       if (docSnapshot.exists()) {
  //           const updatedData = docSnapshot.data();
  //           setFormData(updatedData);
  
  //       // Check for status changes and ensure alerts are only shown once
  //       if (updatedData.status !== lastAlertedStatus.current) {
  //           lastAlertedStatus.current = updatedData.status; 
  //           if (updatedData.status === "completed") {
  //               alert("The job has been completed!");
  //               lastAlertedStatus.current = "completed"; // Update last alerted status
  //           } else if (updatedData.status === "aborted") {
  //               alert("The job has been aborted!");
  //               lastAlertedStatus.current = "aborted"; // Update last alerted status
  //           }
  //           }
  //       }
  //   });
  
  //   listenerAttached.current = true;
  
  //   // Return unsubscribe function for cleanup
  //   return () => {
  //     unsubscribe();
  //     listenerAttached.current = false;
  //   };
  // }, [pi, fullcase.id]);
  
  // const stopListening = useCallback(() => {
  //   if (listenerAttached.current) {
  //     listenerAttached.current = false;
  //   }
  // }, []);  
  
  // useEffect(() => {
  //   let cleanupFn;
  
  //   if (formData.status === "running") {
  //     cleanupFn = startListening(); // Attach listener
  //   } else {
  //     stopListening(); // Detach listener
  //   }
  
  //   // Cleanup listener on unmount or when status changes
  //   return () => {
  //     if (cleanupFn) cleanupFn(); // Ensure listener is cleaned up
  //   };
  // }, [formData.status, startListening, stopListening]);
  
  // useEffect(() => {
  //   // Ensure proper cleanup on navigation away
  //   return () => {
  //     stopListening();
  //   };
  // }, [stopListening]);

    return (
        <div className="App-background">
        <h1>{fullcase.name}</h1>
        {isEditing ? (
            <CaseEdit
            pi={pi}
            fullcase={formData}
            onBack={() => setIsEditing(false)}
            onSaveSuccess={onSaveSuccess}
            />
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
            onClick={() => {
                // listenerAttached.current = false
                onBack();
            }}
            >
            Back
            </button>
        </div>
        )}
    </div>
    );
};

export default CasePreview;