import React, { useState, useEffect } from "react";
import { getStorage, ref, listAll, getDownloadURL } from "firebase/storage";
import "../../App.css";
import "./Album.css";
import { getAuth } from "firebase/auth";

const Album = ({ pi, caseId, onBack }) => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const auth = getAuth();
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
      <h1>Album Page</h1>
      <p>Displaying Album for Case ID: <strong>{caseId}</strong></p>
      <p>Device Serial: <strong>{pi}</strong></p>
      <button className="back-button" onClick={onBack}>
        Back
      </button>
      {loading && <p>Loading images...</p>}
      {error && <p className="error">{error}</p>}
      <div className="image-grid">
        {images.map((url, index) => (
          <img key={index} src={url} alt={`${index}`} className="album-image" />
        ))}
      </div>
    </div>
  );
};

export default Album;