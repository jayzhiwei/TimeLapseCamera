// Img2Video.js
import React, { useState, useEffect } from "react";
import "../../App.css";
import "./Img2Video.css";
import axios from "axios";
import { getStorage, ref, uploadBytesResumable, updateMetadata } from "firebase/storage";
import { getAuth } from "firebase/auth";
import { MdFileDownload, MdCloudUpload, FaPlus } from "../../images/Icons.js";

const resolutions = {
  "Max_View": { label: "12MP (4056x3040)", rank: 6 },
  "4K_UHD": { label: "4K UHD (3840x2160)", rank: 5 },
  "2K_UHD": { label: "2K UHD (2560x1440)", rank: 4 },
  "1080p": { label: "1080p Full HD (1920x1080)", rank: 3 },
  "720p": { label: "720p HD (1280x720)", rank: 2 },
  "SD_480p": { label: "480p SD (640x480)", rank: 1 },
};

const Img2Video = ({ pi, fullcase, imageURLs, onBack }) => {
  const [uploadStatus, setUploadStatus] = useState("");
  const [fps, setFps] = useState(6);
  const [resolution, setResolution] = useState("");
  const [availableResolutions, setAvailableResolutions] = useState([]);
  const [originalR, setoriginalR] = useState("");
  const [customName, setCustomName] = useState("");
  const auth = getAuth();
  const currentUser = auth.currentUser;
  const userUID = currentUser ? currentUser.uid : null;

  useEffect(() => {
    const originalResolutionKey = fullcase.resolution;
    setoriginalR(originalResolutionKey);
    const originalResolution = resolutions[originalResolutionKey];
    if (originalResolution) {
      const filteredResolutions = Object.entries(resolutions).filter(
        ([, { rank }]) => rank <= originalResolution.rank
      );
      setAvailableResolutions(filteredResolutions);
      setResolution((currentResolution) => currentResolution || originalResolutionKey);
    } else {
      console.warn("Original resolution key not found in predefined resolutions.");
    }
  }, [imageURLs]);

  const urls = imageURLs.map((image) => image.url);

  const now = new Date();
  const formattedNow = `${now.getFullYear()}-${(now.getMonth() + 1)
    .toString()
    .padStart(2, "0")}-${now.getDate().toString().padStart(2, "0")} ${now
    .getHours()
    .toString()
    .padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now
    .getSeconds()
    .toString()
    .padStart(2, "0")}`;

  const fileName = `video_${formattedNow.replace(/-/g, "").replace(/:/g, "").replace(/ /g, "_")}.mp4`;

  const pollJobStatus = async (jobId) => {
    const pollInterval = 500; // 0.5 seconds
    return new Promise((resolve, reject) => {
      const intervalId = setInterval(async () => {
        try {
          console.log("Polling job status for job:", jobId);
          const statusResponse = await axios.get(`${process.env.REACT_APP_API_URL}/job-status/${jobId}`);
          console.log("Full job status response:", statusResponse.data);
          const { status, progress, result } = statusResponse.data;
          console.log("Progress object received:", progress);
          const downloadProgress = progress.download || { current: 0, total: 0 };
          const conversionProgress = progress.conversion || { current: 0, total: 0 };
          // Use the progress.stage override.
          const displayStatus = (progress && progress.stage === "Completed") ? "completed" : status;
          setUploadStatus(
            `Job status: ${displayStatus} | Download: ${downloadProgress.current}/${downloadProgress.total} | Conversion: ${conversionProgress.current}/${conversionProgress.total}`
          );
          if (displayStatus === "completed") {
            clearInterval(intervalId);
            if (result && result.videoPath) {
              resolve(result);
            } else {
              reject(new Error("Job completed but videoPath is missing."));
            }
          } else if (status === "failed") {
            clearInterval(intervalId);
            reject(new Error("Video conversion failed."));
          }
        } catch (error) {
          clearInterval(intervalId);
          reject(error);
        }
      }, pollInterval);
    });
  };

  const handleVideoConversion = async (saveToCloud = false, download = true) => {
    try {
      setUploadStatus("Submitting conversion job...");
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/convert`,
        { imageUrls: urls, fps, resolution, fileName }
      );
      const jobId = response.data.jobId;
      setUploadStatus("Conversion job submitted. Waiting for completion...");
      const jobResult = await pollJobStatus(jobId);
      setUploadStatus("Video generated successfully!");
      const videoResponse = await axios.get(
        `${process.env.REACT_APP_API_URL}/download?fileUrl=${encodeURIComponent(jobResult.videoPath)}&customName=${customName}`,
        { responseType: "arraybuffer" }
      );
      const videoBlob = new Blob([videoResponse.data], { type: "video/mp4" });
      if (download) {
        const videoUrl = URL.createObjectURL(videoBlob);
        const link = document.createElement("a");
        link.href = videoUrl;
        link.setAttribute("download", customName);
        document.body.appendChild(link);
        link.click();
        link.remove();
      }
      if (saveToCloud) {
        setUploadStatus("Uploading video to the cloud...");
        const storage = getStorage();
        const storageRef = ref(storage, `films/${userUID}/${pi}/${fullcase.id}/${fileName}`);
        const uploadTask = uploadBytesResumable(storageRef, videoBlob, { contentType: "video/mp4" });
        uploadTask.on(
          "state_changed",
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setUploadStatus(`Upload is ${progress.toFixed(2)}% done`);
          },
          (error) => {
            console.error("Upload failed:", error);
            setUploadStatus("An error occurred while uploading the video.");
          },
          async () => {
            const metadata = {
              customMetadata: {
                name: customName || "Untitled",
                resolution: resolutions[resolution]?.label || resolution,
              },
            };
            await updateMetadata(storageRef, metadata);
            setUploadStatus("Video uploaded to the cloud successfully!");
          }
        );
      }
    } catch (error) {
      console.error("Error processing video:", error);
      setUploadStatus("An error occurred while processing the video.");
    }
  };

  return (
    <div className="App-background">
      <h1>Images to Video Conversion</h1>
      <p><strong>{fullcase.name}</strong></p>
      <p><strong>Total Images: </strong>{fullcase.picturesCaptured}</p>
      <div className="settings">
        <label>
          File Name:
          <input
            type="text"
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            placeholder="Enter a custom name for the video"
          />
        </label>
        <label>
          Frame per second (FPS):
          <select
            id="fps"
            value={fps}
            onChange={(e) => setFps(Number(e.target.value))}
          >
            {Array.from({ length: 60 }, (_, i) => i + 1).map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
        <label>
          Resolution:
          <select value={resolution} onChange={(e) => setResolution(e.target.value)}>
            {availableResolutions.map(([key, { label }]) => (
              <option key={key} value={key}>
                {label}{key === originalR && " (original resolution)"}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="button-group">
        <button onClick={() => handleVideoConversion(false, true)}><MdFileDownload /></button>
        <button onClick={() => handleVideoConversion(true, false)}><MdCloudUpload /></button>
        <button onClick={() => handleVideoConversion(true, true)}>
          <MdFileDownload /> <FaPlus /> <MdCloudUpload />
        </button>
      </div>
      {uploadStatus && <p>{uploadStatus}</p>}
      <button className="back-button" onClick={onBack}>
          Back
        </button>
    </div>
  );
};

export default Img2Video;
