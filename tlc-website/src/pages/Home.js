import React, { useState, useEffect, useCallback, useContext } from 'react';
import { gapi } from 'gapi-script';
import GoogleDriveImages from './GoogleDriveImages';
import { UserContext } from './UserContext';
import './App.css';

const CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;
const API_KEY = process.env.REACT_APP_GOOGLE_API_KEY;
const SCOPES = 'https://www.googleapis.com/auth/drive.metadata.readonly';

console.log("CLIENT_ID from .env:", CLIENT_ID);

function Home() {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const { userProfile, setUserProfile } = useContext(UserContext);
  const [error, setError] = useState(null);

  const handleAuthClick = () => {
    gapi.auth2.getAuthInstance().signIn().catch((error) => {
      console.error("Error signing in:", error);
      setError("Error signing in: " + error.message);
    });
  };

  const handleSignoutClick = () => {
    gapi.auth2.getAuthInstance().signOut().catch((error) => {
      console.error("Error signing out:", error);
      setError("Error signing out: " + error.message);
    });
  };

  const updateSigninStatus = useCallback((isSignedIn) => {
    setIsSignedIn(isSignedIn);
    if (isSignedIn) {
      const profile = gapi.auth2.getAuthInstance().currentUser.get().getBasicProfile();
      setUserProfile({
        name: profile.getName(),
        imageUrl: profile.getImageUrl(),
      });
    } else {
      setUserProfile({ name: '', imageUrl: '' });
    }
  }, [setUserProfile]);

  useEffect(() => {
    const initClient = () => {
      gapi.client.init({
        apiKey: API_KEY,
        clientId: CLIENT_ID,
        discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
        scope: SCOPES,
      }).then(() => {
        console.log("GAPI client initialized successfully");
        const authInstance = gapi.auth2.getAuthInstance();
        authInstance.isSignedIn.listen(updateSigninStatus);
        updateSigninStatus(authInstance.isSignedIn.get());
      }).catch((error) => {
        console.error("Error initializing gapi client:", error);
        setError("Error initializing GAPI client: " + error.message);
      });
    };
    gapi.load('client:auth2', initClient);
  }, [updateSigninStatus]);

  const folderId = '1fL1JRBEfupZpc3LfqMuA0Okn0xK2ngtv';

  return (
    <div className="Home">
      {error && <div className="error">{error}</div>}
      {!isSignedIn ? (
        <div className="login-container">
          <h2>Login with Google</h2>
          <button onClick={handleAuthClick}>Sign In</button>
        </div>
      ) : (
        <div>
          <button onClick={handleSignoutClick}>Sign Out</button>
          <div className="user-info">
            <img src={userProfile.imageUrl} alt={userProfile.name} className="user-image" />
            <span>Welcome, {userProfile.name}</span>
          </div>
          <GoogleDriveImages folderId={folderId} />
        </div>
      )}
    </div>
  );
}

export default Home;