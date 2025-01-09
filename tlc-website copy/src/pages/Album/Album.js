import React, { useEffect, useState, useCallback, useRef } from 'react'
import { gapi } from 'gapi-script';
import { doc, getDoc } from "firebase/firestore";
import { ref, getDownloadURL } from "firebase/storage";
import { onAuthStateChanged } from "firebase/auth";
import { auth, storage , db } from '../../firebase/firebase';
import Folder from '../../components/Folder/Folder';
import '../../App.css'
import './Album.css'

const FOLDER_NAME = 'album';
function Album(){
  const [userId, setUserId] = useState(null);
  const [pairedRasps, setPairedRasps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [raspFolder, setRaspFolder] = useState(null);
  const [error, setError] = useState(null);

  // setUserId
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid); // Set the user's UID
      } else {
        setUserId(null); // User is not logged in
      }
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  // setPairedRasps from Firestore
  useEffect(() => {
    const fetchPairedRasps = async () => {
      if (!userId) return; // Wait until userId is set
      
      const userRef = doc(db, "users", userId); // Get current users collection
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        setPairedRasps(userData.pairedRaspberrys || []);
      } else {
        // docSnap.data() will be undefined in this case
        console.log("No such document!");
        setError("User data not found")
      }
    };
    fetchPairedRasps();
  }, [userId]);

  // setFolderUrl
  // useEffect(() => {
  //   const fetchRasp = async () => {
  //     if (!userId) return; // Wait until userId is set
  //     try {
  //       const connectedRasp = `album/${userId}`;
  //       const fileRef = ref(storage, connectedRasp);
  //       const url = await getDownloadURL(fileRef);
  //       setRaspFolder(url);
  //     } catch (err) {
  //       console.error("Error fetching the URL:", err);
  //       setError("Unable to load image");
  //     }
  //   };
  //   fetchRasp();
  // }, [userId]);

  return (
    <div className='App'>
      <div className="App-background">

        <div className='pairedRasps'>
          {pairedRasps.map(pairedRasp => (
            <p>{pairedRasp}</p>
          ))}
          
        </div>
        
      </div>
    </div>
      
  );
}

export default Album;