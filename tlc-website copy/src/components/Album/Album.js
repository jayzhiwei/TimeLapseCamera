import React from 'react'
import '../../App.css'
import './Album.css'
import { useLocation } from "react-router-dom";

const Album = () => {
  const location = useLocation();
  const { caseId } = location.state || {}; // Extract caseId from state

  return (
    <div className = "App-background">
      <h1>Album Page</h1>
      {caseId ? (
        <p>Displaying Album for Case ID: <strong>{caseId}</strong></p>
      ) : (
        <p>No Case ID provided.</p>
      )}
    </div>
  );
};
export default Album;