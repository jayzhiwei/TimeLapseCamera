import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../../App.css";
import "./Film.css";

const Film = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { caseId, serial } = location.state || {};

    const handleBack = () => {
      navigate("/myDevices", { state: { serial } });
  };

    return (
        <div className="App-background">
            <h1>Film Page</h1>
            <p>Displaying Film for Case ID: <strong>{caseId}</strong></p>
            <p>Device Serial: <strong>{serial}</strong></p>
            <button className="back-button" onClick={handleBack}>
                Back
            </button>
        </div>
    );
};

export default Film;