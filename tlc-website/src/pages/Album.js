import React, { useEffect, useState, useCallback, useRef } from 'react'
import { gapi } from 'gapi-script'
import Folder from './components/Folder'
import './Album.css'

const CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;
const API_KEY = process.env.REACT_APP_GOOGLE_API_KEY;
const SCOPES = 'https://www.googleapis.com/auth/drive.metadata.readonly https://www.googleapis.com/auth/drive';
const FOLDER_NAME = 'album';

const GoogleDrive = () => {
  const [folders, setFolders] = useState([]);
  const [error, setError] = useState(null);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [userProfile, setUserProfile] = useState({ name: '', imageUrl: '' });
  const isInitialized = useRef(false); // Ref to track initialization
  const [initStatus, setInitStatus] = useState(false); // State to track initialization status

  const listFolders = useCallback((parentId) => {
    gapi.client.drive.files.list({
      q: `mimeType='application/vnd.google-apps.folder' and '${parentId}' in parents`,
      fields: 'files(id, name)',
    }).then(response => {
      const files = response.result.files;
      if (files && files.length > 0) {
        setFolders(files);
      } else {
        setFolders([]);
      }
    }).catch(err => {
      setError("Error fetching folders");
    });
  }, []);

  const findFolderByName = useCallback((folderName) => {
    gapi.client.drive.files.list({
      q: `mimeType='application/vnd.google-apps.folder' and name='${folderName}'`,
      fields: 'files(id, name)',
    }).then(response => {
      const files = response.result.files;
      if (files && files.length > 0) {
        const folderId = files[0].id;
        listFolders(folderId);
      } else {
        setFolders([]);
      }
    }).catch(err => {
      setError("Error fetching folder by name");
    });
  }, [listFolders]);

  const updateSigninStatus = useCallback((isSignedIn) => {
    setIsSignedIn(isSignedIn);
    if (isSignedIn) {
      const profile = gapi.auth2.getAuthInstance().currentUser.get().getBasicProfile();
      setUserProfile({
        name: profile.getName(),
        imageUrl: profile.getImageUrl()
      });
      findFolderByName(FOLDER_NAME);
    } else {
      setFolders([]);
      setUserProfile({ name: '', imageUrl: '' });
    }
  }, [findFolderByName]);

  useEffect(() => {
    const start = () => {
      if (!isInitialized.current) {
        gapi.client.init({
          apiKey: API_KEY,
          clientId: CLIENT_ID,
          discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
          scope: SCOPES,
        }).then(() => {
          const authInstance = gapi.auth2.getAuthInstance();
          if (authInstance) {
            authInstance.isSignedIn.listen(updateSigninStatus);
            updateSigninStatus(authInstance.isSignedIn.get()); // Check if the user is already signed in
          } else {
            setError("Error during initialization");
          }
          isInitialized.current = true;
          setInitStatus(true); // Update state to reflect initialization status
        }).catch(err => {
          setError("Error during initialization");
        });
      }
    };
    if (!initStatus) { // Check state before calling the start function
      gapi.load('client:auth2', start);
    }
  }, [updateSigninStatus, initStatus]);

  return (
    <div className="google-drive">
      {isSignedIn && (
        <div className="user-info">
          <img src={userProfile.imageUrl} alt={userProfile.name} className="user-image" />
          <span>Welcome, {userProfile.name}</span>
        </div>
      )}
      {error && <div>Error: {error}</div>}
      <div className="folders-container">
        {folders.length > 0 ? (
          folders.map(folder => (
            <Folder key={folder.id} folder={folder} />
          ))
        ) : (
          <div>No folders found.</div>
        )}
      </div>
    </div>
  );
};

export default GoogleDrive;