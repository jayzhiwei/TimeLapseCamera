import React, { useState, useEffect } from "react";
import { getStorage, ref, listAll, getDownloadURL, getMetadata } from "firebase/storage";
import "../../App.css";
import "./Album.css";
import { getAuth } from "firebase/auth";
import Img2Video from "../Img2Video/Img2Video.js"

const Album = ({ pi, caseId, caseName, onBack }) => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const auth = getAuth();
  const currentUser = auth.currentUser;
  const userUID = currentUser ? currentUser.uid : null;
  const [showImg2VideoPage, setShowImg2VideoPage] = useState(false);
// 
  const formatTimestamp = (timestamp) => {
    const year = timestamp.substring(0, 4);
    const month = timestamp.substring(4, 6); // Note: Month is 1-based
    const day = timestamp.substring(6, 8);
    const hours = timestamp.substring(9, 11);
    const minutes = timestamp.substring(11, 13);
    const seconds = timestamp.substring(13, 15);
    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
  };

  const totalSizeInBytes = images.reduce((total, image) => total + image.metadata.size, 0);

  const formatFileSize = (sizeInBytes) => {
    if (sizeInBytes < 1024) {
      return `${sizeInBytes} B`; // Bytes
    } else if (sizeInBytes < 1024 * 1024) {
      return `${(sizeInBytes / 1024).toFixed(2)} KB`; // Kilobytes
    } else if (sizeInBytes < 1024 * 1024 * 1024) {
      return `${(sizeInBytes / (1024 * 1024)).toFixed(2)} MB`; // Megabytes
    } else {
      return `${(sizeInBytes / (1024 * 1024 * 1024)).toFixed(2)} GB`; // Gigabytes
    }
  };

  useEffect(() => {
    const fetchImages = async () => {
      const storage = getStorage();
      const folderPath = `album/${userUID}/${pi}/${caseId}/`;
      const folderRef = ref(storage, folderPath);

      try {
        const res = await listAll(folderRef); // List all files in the folder
        const filesWithMetadata = await Promise.all(
          res.items.map(async (item) => {
            const url = await getDownloadURL(item);
            const metadata = await getMetadata(item); // Fetch metadata
            return { url, metadata };
          })
        );

      // Sort files by name (timestamps 'YYYYMMDD_HHMMSS')
      const sortedFiles = filesWithMetadata.sort((a, b) =>
        a.metadata.name.localeCompare(b.metadata.name)
      );

        setImages(sortedFiles);
      } catch (err) {
        setError("Failed to fetch images or metadata.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchImages();
  }, [userUID, pi, caseId]);

  // console.log(images)

  if (showImg2VideoPage) {
    return (
        <Img2Video
        pi={pi}
        caseId={caseId}
        caseName={caseName}
        imageURLs={images}
        onBack={() => setShowImg2VideoPage(false)} // Back to RaspiDetail
        />
    );
}

  return (
    <div className="App-background">
      <h1>Album Page</h1>
      <p><strong>{caseName}</strong></p>
      {/* <p>Device Serial: <strong>{pi}</strong></p>
      <p>Displaying Album for Case ID: <strong>{caseId}</strong></p> */}
      {images.length > 0 && (
      <p>
        <strong>Resolution :</strong> {images[0].metadata.customMetadata.Resolution}
      </p>)}
      {images.length > 0 && (
      <p>
        <strong>Content type :</strong> {images[0].metadata.contentType}
      </p>)}
      <p><strong>Total file size:</strong> {formatFileSize(totalSizeInBytes)}</p>
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
      {images.map(({ url, metadata }, index) => (
          <div key={index} className="image-container">
            <img src={url} alt={`${index}`} className="album-image" />
            <div className="image-metadata">
              {/* <p><strong>Name:</strong> {metadata.name}</p> */}
              <p><strong>Capture at:</strong> {formatTimestamp(metadata.name.split('.')[0])}</p>
              <p><strong>CPU:</strong> {metadata.customMetadata.CPU} °C</p>
              <p><strong>Room:</strong> {metadata.customMetadata.Room} °C</p>
              {/* <p><strong>Resolution :</strong> {metadata.customMetadata.Resolution}</p> */}
              <p><strong>Size:</strong> {formatFileSize(metadata.size)}</p>
              {/* <p><strong>Content Type:</strong> {metadata.contentType}</p> */}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Album;