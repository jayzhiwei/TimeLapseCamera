import React , { useState, useEffect } from "react";
import "../../App.css";
import "./Img2Video.css";
import { getAuth } from "firebase/auth";
import { getStorage, ref, listAll, getDownloadURL } from "firebase/storage";

// const ffmpeg = require("@ffmpeg/ffmpeg");

const Img2Video = ({ pi, caseId, onBack }) => {
    const auth = getAuth();
    const [loading, setLoading] = useState(true);
    const [images, setImages] = useState([]);
    const [error, setError] = useState("");
    const currentUser = auth.currentUser;
    const userUID = currentUser ? currentUser.uid : null;

    useEffect(() => {
      const fetchImages = async () => {
        const storage = getStorage();
        const folderPath = `album/${userUID}/${pi}/${caseId}/`; // Update this path to match your storage structure
        // console.log("Fetching images from:", `album/${pi}/${caseId}/`);
        const folderRef = ref(storage, folderPath);

        try {
          const res = await listAll(folderRef); // List all files in the folder
          // console.log("Fetched items:", res.items);
          const urls = await Promise.all(
            res.items.map((item) => getDownloadURL(item)) // Get download URLs
          );
          setImages(urls);
        } catch (err) {
          setError("Failed to fetch images.");
          console.error(err);
        } finally {
          setLoading(false);
        }
      };
      fetchImages();
    }, [userUID, pi, caseId]);

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