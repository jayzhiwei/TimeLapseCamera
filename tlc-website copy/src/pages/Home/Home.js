import React, { useState, useEffect, useContext } from 'react';
import { signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendEmailVerification, updateProfile } from "firebase/auth";
import { auth, storage } from '../../firebase/firebase';
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { UserContext } from '../../components/UserContext';
import '../../App.css';
import './Home.css';
import MyDevices from '../../components/MyDevices/MyDevices.js';
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";

const db = getFirestore();
const defaultProfileImage = 'https://firebasestorage.googleapis.com/v0/b/timelapsefyp2024.appspot.com/o/profile_pictures%2FdefaultProfileImg.png?alt=media&token=4f577cb6-cb51-4001-88c8-5b06ae63490e';

function Home() {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const {userProfile, setUserProfile } = useContext(UserContext);
  const [error, setError] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isEditingProfilePicture, setIsEditingProfilePicture] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState('');

  const isValidEmail = (email) => {const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);};

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
  
  // Google Sign-In
  const handleGoogleSignIn = () => {
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider)
      .then(async(result) => {
        const user = result.user;
        setUserProfile({
          name: user.displayName,
          imageUrl: user.photoURL || defaultProfileImage, // Use default if no profile picture
        });
        setIsSignedIn(true);
        setError(null);
        // Check if user document exists, if not create it
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (!userDocSnap.exists()) {
          await setDoc(userDocRef, {
            email: user.email,
            name: user.displayName || "New User",
            createdAt: new Date(),
          });

          setUserProfile({
            name: user.displayName,
            imageUrl: user.photoURL || defaultProfileImage,
          });

          console.log("New user document created.");
        }
      })
      .catch((error) => {
        console.error("Error signing in:", error);
        setError("Error signing in " + error.message);
      });
  };

  // Email/Password Sign-In
  const handleEmailSignIn = () => {
    signInWithEmailAndPassword(auth, email, password)
      .then(async(result) => {
        const user = result.user;
        if (user.emailVerified) {
          setUserProfile({
            name: user.displayName,
            imageUrl: user.photoURL || defaultProfileImage, // Use default if no profile picture
          });
          setIsSignedIn(true);
          setError(null);

          setUserProfile({
            name: user.displayName,
            imageUrl: user.photoURL || defaultProfileImage,
          });

        } else {
          setError("Please verify your email before signing in.");
        }
      })
      .catch((error) => {
        console.error("Error signing in:", error);
        setError("Error signing in: " + error.message);
      });
  };

  // Function to poll for email verification status
  const pollEmailVerification = (user) => {
    const interval = setInterval(() => {
      user.reload().then(async() => {
        if (user.emailVerified) {
          clearInterval(interval); // Stop polling once verified
          const updatedUser = auth.currentUser;
          // Automatically log the user in
          setUserProfile({
            name: updatedUser.displayName  || "New User",
            imageUrl: updatedUser.photoURL || defaultProfileImage,
          });
          setIsSignedIn(true);
          setError(null);
          console.log("User email verified, logged in automatically.");
          
        }
      }).catch((error) => {
        console.error("Error reloading user:", error);
      });
    }, 5000); // Check every 5 seconds
  };
  
  // Email/Password Sign-Up with Confirmation and Email Verification
  const handleEmailSignUp = () => {
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    createUserWithEmailAndPassword(auth, email, password)
      .then(async(result) => {
        const user = result.user;
        // Check if user document exists, if not create it
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (!userDocSnap.exists()) {
          await setDoc(userDocRef, {
            email: user.email,
            name: user.displayName || "New User",
            createdAt: new Date(),
          });

          // setUserProfile({
          //   name: user.displayName,
          //   imageUrl: user.photoURL || defaultProfileImage,
          // });

          console.log("New user document created.");
        }

      sendEmailVerification(user)
        .then(() => {
          setError("Verification email sent. Please check your inbox.");
          pollEmailVerification(user);
        })
        .catch((error) => {
          console.error("Error sending verification email:", error);
          setError("Error sending verification email: " + error.message);
        });
      setIsSignedIn(false); // Don't sign in immediately; wait for email verification
    })
    .catch((error) => {
      console.error("Error signing up:", error);
      setError("Error signing up: " + error.message);
    });
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

  // Sign-Out
  const handleSignoutClick = () => {
    signOut(auth)
      .then(() => {
        setIsSignedIn(false);
        setUserProfile({ name: '', imageUrl: '' });
        setError(null);
        setIsRegistering(false);
        setConfirmPassword('');
      })
      .catch((error) => {
        console.error("Error signing out:", error);
        setError("Error signing out: " + error.message);
      });
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
  
            setIsSignedIn(true);
            setError(null);
          } catch (error) {
            console.error("Error fetching user data from Firestore:", error);
            setError("Error fetching user data: " + error.message);
          }
        } else {
          setError("Please verify your email before signing in.");
        }
      } else {
        setIsSignedIn(false);
        setUserProfile({ name: '', imageUrl: '' });
      }
    });
  
    return () => unsubscribe();
  }, [setUserProfile]);



  return (
    <div className="App-background">
      {/* {error && <div className="error">{error}</div>} */}
      {!isSignedIn ? (
        <div className="login-container">
          <h2>{isRegistering ? 'Register' : 'Login'}</h2>
          <div className="login-form">

            <input 
              type="email" 
              placeholder="Email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              className="login-input"
            />
            <div className="Register-error-message">
              {email === "" ? null: 
                isValidEmail(email) ? (
                  <span style={{ marginRight: "5px" }}>✅</span>
                ) : (
                  <span style={{ marginRight: "5px" }}>❌</span>
                )}
              {email !== "" &&(
                <span 
                  className={isValidEmail(email) ? "" : "error"}>
                  {isValidEmail(email) === true
                    ? "Valid email address"
                    : "Please enter a valid email address"
                    }
                </span>
              )}
            </div>

            <input 
              type="password" 
              placeholder="Password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              className="login-input"
            />
            <div className="Register-error-message">
              {password === "" || isRegistering === false ? null: 
                password.length >= 6 ? (
                  <span style={{ marginRight: "5px" }}>✅</span>
                ) : (
                  <span style={{ marginRight: "5px" }}>❌</span>
                )}
              {password !== "" && isRegistering && (
                <span 
                className={password.length >= 6 ? "" : "error"}>
                  {password.length >= 6
                    ? "Password lengths is 6"
                    : "Password lengths must be at least 6"
                    }
                </span>
              )}
            </div>

            {isRegistering && (
              <div>
                <input
                  type="password"
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="login-input"
                />
                <div className="Register-error-message">
                  {confirmPassword === "" ? null : // Hide the icons and message when Confirm Password is empty
                    password === confirmPassword ? (
                      <span style={{ marginRight: "5px" }}>✅</span>
                    ) : (
                      <span style={{ marginRight: "5px" }}>❌</span>
                    )}
                  {confirmPassword !== "" && ( // Hide the message when Confirm Password is empty
                    <span 
                    className={password === confirmPassword ? "" : "error"}>
                      {password === confirmPassword
                        ? "Passwords match"
                        : "Passwords do not match"}
                    </span>
                  )}
                </div>
              </div>
            )}

            {isRegistering ? (
              <button 
                onClick={handleEmailSignUp} 
                className="login-button" 
                disabled={!isValidEmail(email) || password.length < 6 || confirmPassword !== password } // Disable if error is present or password is invalid
                style={{
                  opacity:  !isValidEmail(email) || password.length < 6 || confirmPassword !== password ? 0.5 : 1,
                  cursor: !isValidEmail(email) || password.length < 6 || confirmPassword !== password ? "not-allowed" : "pointer"
                }}
              >
                Sign Up
              </button>
            ) : (
              <button 
                onClick={handleEmailSignIn} 
                className="login-button"
                disabled={ !isValidEmail(email) || password.length < 6 } // Disable if error is present or password is invalid
                style={{
                  opacity: !isValidEmail(email) || password.length < 6  ? 0.5 : 1,
                  cursor: !isValidEmail(email) || password.length < 6 ? "not-allowed" : "pointer"
                }}
                >
                Sign In
              </button>
            )}

            {error && <div className="page-error-message">{error}</div>}

            <button onClick={handleGoogleSignIn} className="google-button">
              <img src="https://developers.google.com/identity/images/g-logo.png" alt="Google logo" className="google-logo" />
              Sign in with Google
            </button>

            <p className="toggle-text" onClick={() => setIsRegistering(!isRegistering)}>
              {isRegistering ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}

            </p>
          </div>
        </div>
      ) : (
        <div>
          <button onClick={handleSignoutClick} className="logout-button">Sign Out</button>

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
      )}
      <MyDevices />
    </div>
  );
}

export default Home;