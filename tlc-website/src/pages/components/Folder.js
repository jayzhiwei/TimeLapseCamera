import React from 'react';
import { Link } from 'react-router-dom';
import './Folder.css';

const Folder = ({ folder }) => {
  console.log(`Linking to folder with ID: ${folder.id} and name: ${folder.name}`); // Log the folder details

  return (
    <div className="folder">
      <Link 
        to={`/folder/${folder.id}?name=${encodeURIComponent(folder.name)}`} // Pass folder name as query parameter
        className="folder-link"
      >
        <div className="folder-icon">📁</div>
        <div className="folder-name">{folder.name}</div>
      </Link>
    </div>
  );
};

export default Folder;
