import React from "react";
import "../../App.css";
import "./Img2Video.css";
import { getAuth } from "firebase/auth";
// const ffmpeg = require("@ffmpeg/ffmpeg");

const Img2Video = ({ pi, caseId, onBack }) => {
  const auth = getAuth();
  const currentUser = auth.currentUser;
  const userUID = currentUser ? currentUser.uid : null;

  return (
    <div className="App-background">
      <h1>Img2Video Page</h1>
      <p>userUID: <strong>{userUID}</strong></p>
      <p>Case ID: <strong>{caseId}</strong></p>
      <p>Device Serial: <strong>{pi}</strong></p>
      <button className="back-button" onClick={onBack}>
        Back
      </button>
    </div>
  );
};

export default Img2Video;