import React, { useState, useEffect } from "react";
import { getStorage, ref, listAll, getDownloadURL, getMetadata } from "firebase/storage";
import "../../App.css";
import "./Film.css";
import { getAuth } from "firebase/auth";

const Film = ({ pi, caseId, caseName, onBack }) => {
  const [firebaseUrls, setfirebaseUrls] = useState([]); // Store video URLs
  const [videoUrls, setVideoUrls] = useState([]); // Store video URLs
  const [metadata, setMetadata] = useState([]); // Store metadata for videos
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
      const folderPath = `films/${userUID}/${pi}/${caseId}/`;
      const folderRef = ref(storage, folderPath);
  
      try {
        const res = await listAll(folderRef);
        if (res.items.length === 0) {
          setError("No videos found for this case.");
          return;
        }

        const firebaseurls = [];
        const urls = [];
        const metadataList = [];
        
        for (const item of res.items) {
          const firebaseVideoURL = await getDownloadURL(item); // Fetch Firebase URL
          const metadata = await getMetadata(item); // Fetch metadata
          const videoPath = firebaseVideoURL.split("/o/")[1]; // Extract the path after '/o/'
          
          firebaseurls.push(firebaseVideoURL)
          urls.push(`${imageKitBaseURL}${videoPath}`); // Transform to ImageKit URL
          metadataList.push(metadata); // Store metadata separately
        }
        setfirebaseUrls(firebaseurls);
        setVideoUrls(urls); // Store ImageKit URLs
        setMetadata(metadataList); // Store metadata
      } catch (err) {
        console.error("Failed to fetch videos:", err);
        setError("Failed to load videos for this case.");
      } finally {
        setLoading(false);
      }
    };
  
    fetchVideos();
  }, [userUID, pi, caseId, imageKitBaseURL]);


  const handleDownload = async (fileUrl, customName) => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/download?fileUrl=${encodeURIComponent(
          fileUrl
        )}&customName=${encodeURIComponent(customName)}`,
        {
          method: "GET",
        }
      );
  
      if (!response.ok) {
        throw new Error("Failed to download the file.");
      }
  
      // Create a blob from the response
      const blob = await response.blob();
  
      // Create a download link
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = customName || "video.mp4"; // Custom filename
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  
      URL.revokeObjectURL(blobUrl); // Clean up
    } catch (error) {
      console.error("Error downloading the file:", error);
    }
  };
  
  
  
  const handleError = (e) => {
    console.error("Error playing video:", e);
    const errorMessage = e?.target?.error?.message || "An unknown error occurred.";
    setError(`Error playing video: ${errorMessage}`);
  };

  return (
    <div className="App-background">
      <h1>Film Page</h1>
      <p><strong>{caseName}</strong></p>
  
      <button className="back-button" onClick={onBack}>
        Back
      </button>
  
      {loading && <p>Loading videos...</p>}
      {error && <p className="error-message">{error}</p>}
  
      <div className="video-gallery">
        {videoUrls.map((url, index) => (
          <div key={index} className="video-item">
            {/* Video Player */}
            <video
              className="video-player"
              controls
              onError={handleError}
            >
              <source src={url} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
  
            {/* Metadata */}
            <div className="video-metadata">
              <ul>
                <li><strong>Name:</strong> {metadata[index]?.customMetadata?.name || "N/A"}</li>
                <li><strong>Resolution:</strong> {metadata[index]?.customMetadata?.resolution || "N/A"}</li>
                <li><strong>Size:</strong> {(metadata[index]?.size / (1024 * 1024)).toFixed(2)} MB</li>
                <li><strong>Content Type:</strong> {metadata[index]?.contentType || "N/A"}</li>
                <li>
                  <strong>Created:</strong>{" "}
                  {metadata[index]?.updated? new Date(metadata[index].timeCreated).toLocaleString("en-GB", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                        hour12: true,
                      }): "N/A"}
                </li>
              </ul>
            </div>
            <button
              className="download-button"
              onClick={() => handleDownload( firebaseUrls[index], metadata[index]?.customMetadata?.name || "video.mp4")}
            >
              Download
            </button>

          </div>
        ))}
      </div>
    </div>
  );
  
};

export default Film;