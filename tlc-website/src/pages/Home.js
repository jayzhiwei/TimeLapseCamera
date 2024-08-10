import React, { useState, useEffect, useCallback, useContext } from 'react';
import { gapi } from 'gapi-script';
import { UserContext } from './UserContext';
import './App.css';
import './Home.css'

const CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;
const API_KEY = process.env.REACT_APP_GOOGLE_API_KEY;
const SCOPES = 'https://www.googleapis.com/auth/drive.metadata.readonly https://www.googleapis.com/auth/drive';

function Home() {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const { userProfile, setUserProfile } = useContext(UserContext);
  const [error, setError] = useState(null);
  const [usedStorage, setUsedStorage] = useState(0);
  const [totalStorage, setTotalStorage] = useState(0);

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

  const fetchStorageInfo = useCallback(() => {
    gapi.client.drive.about.get({
      fields: 'storageQuota(limit, usage)',
    }).then(response => {
      const { limit, usage } = response.result.storageQuota;
      setUsedStorage(parseInt(usage));
      setTotalStorage(parseInt(limit));
    }).catch((error) => {
      console.error("Error fetching storage info:", error);
      setError("Error fetching storage info: " + error.message);
    });
  }, []);

  const updateSigninStatus = useCallback((isSignedIn) => {
    setIsSignedIn(isSignedIn);
    if (isSignedIn) {
      const profile = gapi.auth2.getAuthInstance().currentUser.get().getBasicProfile();
      setUserProfile({
        name: profile.getName(),
        imageUrl: profile.getImageUrl(),
      });
      fetchStorageInfo(); // Fetch storage info after signing in
    } else {
      setUserProfile({ name: '', imageUrl: '' });
    }
  }, [setUserProfile, fetchStorageInfo]);

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

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const calculateProgress = () => {
    if (totalStorage === 0) return 0;
    return (usedStorage / totalStorage) * 100;
  };

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
          <div className="storage-info">
            <h3>Google Drive Storage:</h3>
            <div className="progress-bar-container">
              <div className="progress-bar" style={{ width: `${calculateProgress()}%` }}></div>
            </div>
            <p>{`${formatBytes(usedStorage)} of ${formatBytes(totalStorage)} used`}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;