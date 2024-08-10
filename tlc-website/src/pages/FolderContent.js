import React, { useEffect, useState, useRef } from 'react';
import { gapi } from 'gapi-script';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import GoogleDriveImages from './GoogleDriveImages';
import './App.css';
import './FolderContent.css';

const CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;
const API_KEY = process.env.REACT_APP_GOOGLE_API_KEY;
const SCOPES = 'https://www.googleapis.com/auth/drive.metadata.readonly https://www.googleapis.com/auth/drive';

function FolderContent() {
  const { id } = useParams(); // Retrieves the ID from the URL
  const location = useLocation();
  const navigate = useNavigate();
  const query = new URLSearchParams(location.search);
  const initialFolderName = location.state?.folderName || query.get('name') || '';
  const [folderName, setFolderName] = useState(initialFolderName);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [error, setError] = useState(null);
  const [reloadTrigger, setReloadTrigger] = useState(false); // State to trigger reloading of images
  const isInitialized = useRef(false); // Ref to track initialization

  // Initialize gapi and set up the sign-in state
  useEffect(() => {
    const initClient = () => {
      gapi.client.init({
        apiKey: API_KEY,
        clientId: CLIENT_ID,
        discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
        scope: SCOPES,
      }).then(() => {
        const authInstance = gapi.auth2.getAuthInstance();
        authInstance.isSignedIn.listen(setIsSignedIn);
        setIsSignedIn(authInstance.isSignedIn.get());
        isInitialized.current = true; // Mark as initialized
      }).catch(err => {
        console.error('Error initializing gapi:', err);
        setError('Error initializing gapi');
      });
    };

    if (!isInitialized.current) {
      gapi.load('client:auth2', initClient);
    }
  }, []);

  // Fetch the folder name when the component mounts or when id, isSignedIn changes
  useEffect(() => {
    if (isSignedIn && id && !folderName) {
      fetchFolderName(id); // Fetch the name if it's not already set
    }
  }, [id, isSignedIn, folderName]);

  const fetchFolderName = async (folderId) => {
    try {
      console.log(`Fetching folder name for folder ID: ${folderId}`);
      const response = await gapi.client.drive.files.get({
        fileId: folderId,
        fields: 'name',
      });
      console.log('API response:', response);
      setFolderName(response.result.name);
    } catch (error) {
      console.error('Error fetching folder name:', error);
      setFolderName('Unknown Folder');
    }
  };

  const goBack = () => {
    navigate(-1); // Navigate to the previous page
  };

  const refreshData = () => {
    console.log('Refresh button clicked');
    if (isSignedIn && id) {
      console.log('Fetching data...');
      fetchFolderName(id).then(() => {
        console.log('Data fetched, folderName updated to:', folderName);
        setReloadTrigger(prev => !prev); // Toggle the reload trigger to force re-render
      });
    } else {
      console.log('Not signed in or missing folder ID');
    }
  };

  return (
    <div className="FolderContent">
      <button onClick={goBack}>Previous</button>
      <button onClick={refreshData}>Refresh</button> {/* Refresh button */}
      <h2>Folder Name: {folderName}</h2>
      {error && <p>{error}</p>}
      <p>ID: {id}</p>
      <GoogleDriveImages folderId={id} reloadTrigger={reloadTrigger} /> {/* Pass reloadTrigger as prop */}
    </div>
  );
}

export default FolderContent;
