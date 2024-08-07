import React, { useEffect, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import GoogleDriveImages from './GoogleDriveImages';
import './App.css';
import { gapi } from 'gapi-script';

const API_KEY = process.env.REACT_APP_GOOGLE_API_KEY;

function FolderContent({ isSignedIn }) {
  const { id } = useParams();
  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const initialFolderName = location.state?.folderName || query.get('name') || '';
  const [folderName, setFolderName] = useState(initialFolderName);

  useEffect(() => {
    console.log('Location state:', location.state); // Log the location state

    if (!folderName && isSignedIn && id) {
      console.log('Folder name not found in link state, fetching from API...');

      const fetchFolderName = async (folderId) => {
        try {
          console.log(`Fetching folder name for folder ID: ${folderId}`);
          const response = await gapi.client.drive.files.get({
            fileId: folderId,
            fields: 'name',
            key: API_KEY,
          });
          console.log('API response:', response);
          setFolderName(response.result.name);
        } catch (error) {
          console.error('Error fetching folder name:', error);
        }
      };

      fetchFolderName(id);
    }
  }, [id, isSignedIn, folderName, location.state]);

  return (
    <div>
      <h2>Folder Name: {folderName}</h2>
      <p>ID: {id}</p>
      <GoogleDriveImages folderId={id} />
    </div>
  );
}

export default FolderContent;