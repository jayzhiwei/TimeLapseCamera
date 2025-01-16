import React from "react";
import "../../App.css";
import "./Film.css";

const Film = ({ pi, caseId, onBack }) => {
    return (
      <div className="App-background">
        <h1>Film Page</h1>
        <p>Film Case ID: <strong>{caseId}</strong></p>
        <p>Device Serial: <strong>{pi}</strong></p>
        <button className="back-button" onClick={onBack}>
          Back
        </button>
      </div>
    );
  };

  export default Film;