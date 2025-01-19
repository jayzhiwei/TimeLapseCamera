import React, { useState, useEffect } from "react";
import "../../App.css";
import "./Img2Video.css";
import axios from "axios";

const resolutions = {
  "Max_View": { label: "12MP (4056x3040)", rank: 6 },
  "4K_UHD": { label: "4K UHD (3840x2160)", rank: 5 },
  "2K_UHD": { label: "2K UHD (2560x1440)", rank: 4 },
  "1080p": { label: "1080p Full HD (1920x1080)", rank: 3 },
  "720p": { label: "720p HD (1280x720)", rank: 2 },
  "SD_480p": { label: "480p SD (640x480)", rank: 1 },
};

const Img2Video = ({ pi, caseId, caseName, imageURLs, onBack }) => {
  const [uploadStatus, setUploadStatus] = useState("");
  const [fps, setFps] = useState(30); // Default FPS
  const [resolution, setResolution] = useState(""); // Default resolution
  const [availableResolutions, setAvailableResolutions] = useState([]);
  // console.log(imageURLs[0].metadata.customMetadata.Resolution)

  useEffect(() => {
    if (imageURLs.length > 0 && imageURLs[0]?.metadata?.customMetadata?.Resolution) {
      const originalResolutionKey = imageURLs[0].metadata.customMetadata.Resolution.trim();
  
      // Find the rank of the original resolution
      const originalResolution = resolutions[originalResolutionKey];
  
      if (originalResolution) {
        // Filter resolutions by rank
        const filteredResolutions = Object.entries(resolutions).filter(
          ([, { rank }]) => rank <= originalResolution.rank
        );
  
        setAvailableResolutions(filteredResolutions);
        setResolution(originalResolutionKey); // Set default to the original resolution
      } else {
        console.warn("Original resolution key not found in predefined resolutions.");
      }
    } else {
      console.warn("Resolution metadata missing or imageURLs is empty.");
    }
  }, [imageURLs]);  
  
  const handleConvertToVideo = async () => {
    try {
      setUploadStatus("Converting images to video...");
      const response = await axios.post(
        "http://localhost:5000/convert",
        {
          imageURLs, // Use passed imageUrls
          fps,
          resolution,
        },
        {
          responseType: "blob", // Handle video file download
        }
      );
      
      setUploadStatus("Downloading video...");
      const videoUrl = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = videoUrl;
      link.setAttribute("download", "output.mp4");
      document.body.appendChild(link);
      link.click();
      link.remove();
      setUploadStatus("Video downloaded successfully!");
    } catch (error) {
      console.error("Error converting images to video:", error);
      setUploadStatus("Error converting images to video.");
    }
  };

  return (
    <div className="App-background">
      <h1>Images to Video Convertion</h1>
      <p><strong>{caseName}</strong></p>
      {/* <p>Case ID: <strong>{caseId}</strong></p>
      <p>Device Serial: <strong>{pi}</strong></p> */}
      <div className="settings">
        <label>
          FPS: 
          <input
            type="number"
            value={fps}
            onChange={(e) => setFps(e.target.value)}
            min="1"
            max="60"
          />
        </label>
        <label>
          Resolution: 
            <select value={resolution} onChange={(e) => setResolution(e.target.value)}>
              {availableResolutions.map(([key, { label }]) => (
                <option key={key} value={key}>
                  {label}
                  {resolution === key && " (original resolution)"}
                </option>
              ))}
            </select>
        </label>
      </div>
      <button className="convert-button" onClick={handleConvertToVideo}>
        Convert to Video
      </button>
      <button className="back-button" onClick={onBack}>
        Back
      </button>
      {uploadStatus && <p>{uploadStatus}</p>}
    </div>
  );
};

export default Img2Video;
