import React, { useState, useEffect, useContext } from 'react';
import { signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendEmailVerification, updateProfile } from "firebase/auth";
import { auth } from '../firebase/firebase';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { UserContext } from './UserContext';
import './App.css';
import './Home.css';

const defaultProfileImage = 'https://firebasestorage.googleapis.com/v0/b/timelapsefyp2024.appspot.com/o/profile_pictures%2FdefaultProfileImg.png?alt=media&token=d30677b9-e6f4-459d-bd54-070f5f3002cc';

function Home() {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const { userProfile, setUserProfile } = useContext(UserContext);
  const [error, setError] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isEditingProfilePicture, setIsEditingProfilePicture] = useState(false);

  const storage = getStorage(); // Initialize Firebase Storage

  // Google Sign-In
  const handleGoogleSignIn = () => {
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider)
      .then((result) => {
        const user = result.user;
        setUserProfile({
          name: user.displayName,
          imageUrl: user.photoURL || defaultProfileImage, // Use default if no profile picture
        });
        setIsSignedIn(true);
        setError(null);
      })
      .catch((error) => {
        console.error("Error signing in:", error);
        setError("Error signing in: " + error.message);
      });
  };

  // Email/Password Sign-In
  const handleEmailSignIn = () => {
    signInWithEmailAndPassword(auth, email, password)
      .then((result) => {
        const user = result.user;
        if (user.emailVerified) {
          setUserProfile({
            name: user.email,
            imageUrl: user.photoURL || defaultProfileImage, // Use default if no profile picture
          });
          setIsSignedIn(true);
          setError(null);
        } else {
          setError("Please verify your email before signing in.");
        }
      })
      .catch((error) => {
        console.error("Error signing in:", error);
        setError("Error signing in: " + error.message);
      });
  };

  // Email/Password Sign-Up with Confirmation and Email Verification
  const handleEmailSignUp = () => {
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    createUserWithEmailAndPassword(auth, email, password)
      .then((result) => {
        const user = result.user;
        sendEmailVerification(user)
          .then(() => {
            setError("Verification email sent. Please check your inbox.");
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
              name: auth.currentUser.displayName || auth.currentUser.email,
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
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        if (user.emailVerified) {
          setUserProfile({
            name: user.displayName || user.email,
            imageUrl: user.photoURL || defaultProfileImage, // Use default if no profile picture
          });
          setIsSignedIn(true);
          setError(null);
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
      {error && <div className="error">{error}</div>}
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
            <input 
              type="password" 
              placeholder="Password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              className="login-input"
            />
            {isRegistering && (
              <input 
                type="password" 
                placeholder="Confirm Password" 
                value={confirmPassword} 
                onChange={(e) => setConfirmPassword(e.target.value)} 
                className="login-input"
              />
            )}
            {isRegistering ? (
              <button onClick={handleEmailSignUp} className="login-button">Sign Up</button>
            ) : (
              <button onClick={handleEmailSignIn} className="login-button">Sign In</button>
            )}
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
            <img src={userProfile.imageUrl} alt={userProfile.name} className="user-image" onClick={handleProfilePictureClick} />
            <span>Welcome, {userProfile.name}</span>
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
    </div>
  );
}

export default Home;