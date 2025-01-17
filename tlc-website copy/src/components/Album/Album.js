import React, { useState, useEffect } from "react";
import { getStorage, ref, listAll, getDownloadURL } from "firebase/storage";
import "../../App.css";
import "./Album.css";
import { getAuth } from "firebase/auth";
import Img2Video from "../Img2Video/Img2Video.js"

const Album = ({ pi, caseId, onBack }) => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const auth = getAuth();
  const currentUser = auth.currentUser;
  const userUID = currentUser ? currentUser.uid : null;
  const [showImg2VideoPage, setShowImg2VideoPage] = useState(false);

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

  if (showImg2VideoPage) {
    return (
        <Img2Video
        pi={pi}
        caseId={caseId}
        onBack={() => setShowImg2VideoPage(false)} // Back to RaspiDetail
        />
    );
}

  return (
    <div className="App-background">
      <h1>Album Page</h1>
      <p>Displaying Album for Case ID: <strong>{caseId}</strong></p>
      <p>Device Serial: <strong>{pi}</strong></p>
      <button className="back-button" onClick={onBack}>
        Back
      </button>
      <button
        className="Details-button"
        onClick={() => {;
            setShowImg2VideoPage(true);
        }}>
        Image to Video
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