import React, { useState, useEffect, useContext } from 'react';
import { onAuthStateChanged, updateProfile } from "firebase/auth";
import { auth, storage, db } from '../../firebase/firebase';
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { UserContext } from '../../components/UserContext';
import ErrorMsg from '../../components/ErrorMsg/ErrorMsg.js';
import '../../App.css';
import './Home.css';
import MyDevices from '../../components/MyDevices/MyDevices.js';
import { doc, setDoc, getDoc } from "firebase/firestore";

const defaultProfileImage = 'https://firebasestorage.googleapis.com/v0/b/timelapsefyp2024.appspot.com/o/profile_pictures%2FdefaultProfileImg.png?alt=media&token=4f577cb6-cb51-4001-88c8-5b06ae63490e';

function Home() {
  const [error, setError] = useState(null);
  const {userProfile, setUserProfile } = useContext(UserContext);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isEditingProfilePicture, setIsEditingProfilePicture] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState('');

  // Function to handle name change
  const handleNameChange = async () => {
    if (!newName.trim()) {
      setError("Name cannot be empty.");
      return;
    }

    try {
      const userDocRef = doc(db, "users", auth.currentUser.uid);

      // Update Firestore
      await setDoc(
        userDocRef,
        {
          name: newName,
          lastModified: new Date(), // Update timestamp
        },
        { merge: true } // Merge to avoid overwriting other fields
      );

      // Update user profile state
      setUserProfile((prev) => ({
        ...prev,
        name: newName,
      }));

      setIsEditingName(false); // Close the editing state
      setError(null);
      console.log("Name updated successfully.");
    } catch (error) {
      console.error("Error updating name:", error);
      setError("Error updating name: " + error.message);
    }
  };

  // Handle Profile Picture Change
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setSelectedFile(file);
  };

  // Upload the new profile picture to Firebase Storage
  const handleUploadProfilePicture = () => {
    if (!selectedFile) return;

    const storageRef = ref(storage, `profile_pictures/${auth.currentUser.uid}`);
    const uploadTask = uploadBytesResumable(storageRef, selectedFile);

    uploadTask.on('state_changed', 
      (snapshot) => {
        // Optional: Monitor upload progress
      }, 
      (error) => {
        console.error("Error uploading file:", error);
        setError("Error uploading file: " + error.message);
      }, 
      () => {
        // Get the download URL once the file is uploaded
        getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
          // Update the user's profile with the new image URL
          updateProfile(auth.currentUser, {
            photoURL: downloadURL,
          }).then(() => {
            setUserProfile({
              name: auth.currentUser.displayName,
              imageUrl: downloadURL,
            });
            setError(null);
            setIsEditingProfilePicture(false); // Hide the file input and upload button
            setSelectedFile(null); // Clear selected file
          }).catch((error) => {
            console.error("Error updating profile:", error);
            setError("Error updating profile: " + error.message);
          });
        });
      }
    );
  };

  // Toggle visibility of profile picture edit section
  const handleProfilePictureClick = () => {
    setIsEditingProfilePicture(!isEditingProfilePicture);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        if (user.emailVerified) {
          try {
            const userDocRef = doc(db, "users", user.uid);
            const userDocSnap = await getDoc(userDocRef);
  
            if (userDocSnap.exists()) {
              const userData = userDocSnap.data();
              setUserProfile({
                name: userData.name || user.displayName || "New User",
                imageUrl: user.photoURL || defaultProfileImage, // Use default if no profile picture
              });
            } else {
              // If the user document doesn't exist, fallback to default
              setUserProfile({
                name: user.displayName || "New User",
                imageUrl: user.photoURL || defaultProfileImage,
              });
              console.error("User document does not exist in Firestore.");
            }
  
            setError(null);
          } catch (error) {
            console.error("Error fetching user data from Firestore:", error);
            setError("Error fetching user data: " + error.message);
          }
        } else {
          setError("Please verify your email before signing in.");
        }
      } else {
        setUserProfile({ name: '', imageUrl: '' });
      }
    });
  
    return () => unsubscribe();
  }, [setUserProfile]);

  const handleUserInfoVisibility = () => {

  };

  return (
    <div className="App-background">
      <ErrorMsg error={error} />
        <div>
          <div className="user-info">
            <img src={userProfile.imageUrl} 
            alt={userProfile.name} 
            className="user-image" 
            onLoad={() => console.log("Image loaded successfully.")}
            onError={(e) => {
              e.target.src = defaultProfileImage; // Fallback to default image on error
              console.error("Error loading profile image.");}}
            onClick={handleProfilePictureClick}
            />

            {isEditingName ? (
              <div>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Enter new name"
                  className="name-input"
                />
                <button onClick={handleNameChange} className="save-name-button">
                  Save
                </button>
                <button
                  onClick={() => setIsEditingName(false)}
                  className="cancel-name-button"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <span>
                Welcome, {userProfile.name}{" "}
                <button
                  onClick={() => {
                    setIsEditingName(true);
                    setNewName(userProfile.name || "");
                  }}
                  className="edit-name-button"
                >
                  Change Name
                </button>
                </span>
            )}

          </div>
          {isEditingProfilePicture && (
            <div className="profile-picture-upload">
              <input type="file" onChange={handleFileChange} />
              {selectedFile && (
                <button onClick={handleUploadProfilePicture} className="upload-button">Upload New Profile Picture</button>
              )}
            </div>
          )}
        </div>
        <div className="myDevices-component">
          <MyDevices />
        </div>
    </div>
  );
}

export default Home;