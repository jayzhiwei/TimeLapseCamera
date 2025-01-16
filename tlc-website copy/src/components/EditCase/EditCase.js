import React from "react";
import "../../App.css";
import "./EditCase.css";

const EditCase = ({ pi, caseId, onBack }) => {
    return (
      <div className="App-background">
        <h1>Edit Page</h1>
        <p>Edit Case ID: <strong>{caseId}</strong></p>
        <p>Device Serial: <strong>{pi}</strong></p>
        <button className="back-button" onClick={onBack}>
          Back
        </button>
      </div>
    );
  };

  export default EditCase;