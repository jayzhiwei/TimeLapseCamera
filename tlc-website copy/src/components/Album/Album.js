import React, { useState, useEffect, useCallback} from "react";
import { getStorage, ref, listAll, getDownloadURL, getMetadata } from "firebase/storage";
import { updateDoc, doc } from "firebase/firestore";
import { db } from "../../firebase/firebase.js";
import "../../App.css";
import "./Album.css";
import { getAuth } from "firebase/auth";
import Img2Video from "../Img2Video/Img2Video.js"

const Album = ({ pi, fullcase, onBack, onUpdateCase }) => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const auth = getAuth();
  const currentUser = auth.currentUser;
  const userUID = currentUser ? currentUser.uid : null;
  const [showImg2VideoPage, setShowImg2VideoPage] = useState(false);
  const [localFullcase, setLocalFullcase] = useState(fullcase);

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
  
  const docRef = doc(db, `raspberrys/${pi}/TimeLapseCase/${fullcase.id}`);

  // Update firebase picturesCaptured for current caseID
  const updateFirebaseCount = useCallback(async (imagesFetched) => {
    const updatedData = {picturesCaptured: imagesFetched,};
    await updateDoc(docRef, updatedData);
    
    const updatedCase = { ...localFullcase, picturesCaptured: imagesFetched };
    setLocalFullcase(updatedCase);
    onUpdateCase(updatedCase);

    console.log("Firebase updated successfully.");
    console.log(imagesFetched)
  }, [docRef, localFullcase, onUpdateCase]);

  // useEffect(() => {
  //   console.log("Updated localFullcase:", localFullcase);
  // }, [localFullcase]);

  useEffect(() => {
    const fetchImages = async () => {
      const storage = getStorage();
      const folderPath = `album/${userUID}/${pi}/${fullcase.id}/`;
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

      // Trigger count comparison after fetching images
      const imagesFetched = sortedFiles.length;
      // if (
      //   imagesFetched !== localFullcase.picturesCaptured ||
      //   imagesFetched !== fullcase.picturesCaptured
      // ){  
        // console.log(imagesFetched)
        // console.log(localFullcase.picturesCaptured)
      if (
        fullcase.picturesCaptured === undefined ||
        localFullcase.picturesCaptured === undefined ||
        imagesFetched !== localFullcase.picturesCaptured ||
        imagesFetched !== fullcase.picturesCaptured
      ){
        await updateFirebaseCount(imagesFetched);
      }
      // }
      } catch (err) {
        setError("Failed to fetch images or metadata.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchImages();
  }, [userUID, pi, fullcase.id, fullcase.picturesCaptured, localFullcase.picturesCaptured, updateFirebaseCount]);

  // console.log(images)
//   const compareAndUpdateCount = async () => {
//     const imagesFetched = images ? Object.keys(images).length : 0;

//     if (imagesFetched !== fullcase.picturesCaptured) {
//         console.log('Mismatch detected. Updating Firebase...');
//         updateFirebaseCount(imagesFetched); // Call the update function
//     } else {
//         console.log('Counts match. No update needed.');
//     }
// };

  if (showImg2VideoPage) {
    return (
        <Img2Video
        pi={pi}
        fullcase={fullcase}
        imageURLs={images}
        onBack={() => setShowImg2VideoPage(false)} // Back to RaspiDetail
        />
    );
}

  return (
    <div className="App-background">
    <div className="fullcase-details">
      <h2>{fullcase.name}</h2>
      <p>
        <strong>Total Images: </strong> 
        {fullcase.picturesCaptured || localFullcase.picturesCaptured}
      </p>

      {images.length > 0 && (
        <p><strong>Resolution: </strong> {images[0].metadata.customMetadata.Resolution}</p>
      )}

      {images.length > 0 && (
        <p><strong>Content Type: </strong> {images[0].metadata.contentType}</p>
      )}

      <p><strong>Total File Size: </strong> {formatFileSize(totalSizeInBytes)}</p>
    </div>
      
      {/* <p>Device Serial: <strong>{pi}</strong></p>
      <p>Displaying Album for Case ID: <strong>{caseId}</strong></p> */}
      
      <div className="buttonContainer">
        <button
          className="button"
          onClick={() => {;
              setShowImg2VideoPage(true);
          }}
          disabled = {images.length === 0}
          >
          Image to Video
        </button>

        <button className="button" onClick={onBack}>
          Back
        </button>
      </div>

      {loading && <p>Loading images...</p>}
      {error && <p className="error">{error}</p>}

      <div >
        <div>
          {images.map(({ url, metadata }, index) => (
            <div key={index} class="responsive">
              <div class="gallery">
              <a target="_blank" rel="noopener noreferrer" href={url}>
                <img src={url} alt={`${index}`} width="600" height="400" />
              </a>
              <div className="desc"> 
                <strong>{formatTimestamp(metadata.name.split('.')[0])}</strong><br />
                <strong>CPU:</strong> {metadata.customMetadata.CPU} °C<br />
                <strong>Room:</strong> {metadata.customMetadata.Room} °C<br />
                <strong>Size:</strong> {formatFileSize(metadata.size)}
                {/* <p><strong>Name:</strong> {metadata.name}</p> */}
                {/* <p><strong>Resolution :</strong> {metadata.customMetadata.Resolution}</p> */}
                {/* <p><strong>Content Type:</strong> {metadata.contentType}</p> */}
              </div>
              </div>
              </div>
          ))}
          <div class="clearfix"></div>
        </div>
      </div>
    </div>
    
  );
};

export default Album;