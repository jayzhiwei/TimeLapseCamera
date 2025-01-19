import React, { useState, useEffect } from "react";
import { getStorage, ref, listAll, getDownloadURL } from "firebase/storage";
import "../../App.css";
import "./Film.css";
import { getAuth } from "firebase/auth";

const Film = ({ pi, caseId, caseName, onBack }) => {
  const [videoUrls, setVideoUrls] = useState([]); // Store video URLs
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const auth = getAuth();
  const currentUser = auth.currentUser;
  const userUID = currentUser ? currentUser.uid : null;

  const imageKitBaseURL = "https://ik.imagekit.io/i3q8onld6/"; // Base URL for ImageKit

  useEffect(() => {
    const fetchVideos = async () => {
      if (!userUID) {
        setError("User not authenticated.");
        setLoading(false);
        return;
      }

      const storage = getStorage();
      const folderPath = `films/${userUID}/${pi}/${caseId}/`; // Update this path to match your storage structure
      // console.log("Fetching films from:", folderPath);
      const folderRef = ref(storage, folderPath);

      try {
        const res = await listAll(folderRef); // List all files in the folder
        if (res.items.length === 0) {
          setError("No videos found for this case.");
          return;
        }

        const urls = await Promise.all(
          res.items.map(async (item) => {
            const firebaseVideoURL = await getDownloadURL(item); // Fetch Firebase URL
            const videoPath = firebaseVideoURL.split("/o/")[1]; // Extract the path after '/o/'
            return `${imageKitBaseURL}${videoPath}`; // Construct ImageKit URL
          })
        );
        setVideoUrls(urls); // Store the ImageKit URLs
      } catch (err) {
        console.error("Failed to fetch videos:", err);
        setError("Failed to load videos for this case.");
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, [userUID, pi, caseId, imageKitBaseURL]);

  const handleError = (e) => {
    console.error("Error playing video:", e);
    const errorMessage = e?.target?.error?.message || "An unknown error occurred.";
    setError(`Error playing video: ${errorMessage}`);
  };

  return (
    <div className="App-background">
      <h1>Film Page</h1>
      {/* <p>Displaying Film for Case ID: <strong>{caseId}</strong></p>
      <p>Device Serial: <strong>{pi}</strong></p> */}
      <p><strong>{caseName}</strong></p>

      <button className="back-button" onClick={onBack}>
        Back
      </button>

      {loading && <p>Loading videos...</p>}
      {error && <p className="error-message">{error}</p>}

      <div className="films-container">
        {videoUrls.map((url, index) => (
          <div key={index} className="video-wrapper">
            <video
              controls
              width="50%"
              height="auto"
              onError={handleError}
            >
              <source src={url} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Film;
