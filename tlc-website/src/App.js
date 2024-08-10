import React, { useEffect, useState } from 'react';
import { Route, Routes } from 'react-router-dom';
import Navbar from './Navbar';
import About from './pages/About';
import Albums from './pages/Album';
import Home from './pages/Home';
import RaspberryCam from './pages/RaspberryCam';
import FolderContent from './pages/FolderContent';
import { UserProvider } from './pages/UserContext';
import { gapi } from 'gapi-script';

const CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;
const API_KEY = process.env.REACT_APP_GOOGLE_API_KEY;

function App() {
  const [isSignedIn, setIsSignedIn] = useState(false);
  
  useEffect(() => {
    const start = () => {
      gapi.client.init({
        apiKey: API_KEY,
        clientId: CLIENT_ID,
        discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
        scope: 'https://www.googleapis.com/auth/drive.readonly',
      }).then(() => {
        const authInstance = gapi.auth2.getAuthInstance();
        setIsSignedIn(authInstance.isSignedIn.get());
        authInstance.isSignedIn.listen(setIsSignedIn);
      }).catch(err => {
        console.error("Error initializing GAPI client:", err);
      });
    };
    gapi.load('client:auth2', start);
  }, []);
  
  return (
    <UserProvider>
        <Navbar />
        <div className='container'>
          <Routes>
            <Route path='/' element={<Home />} />
            <Route path='/googledrivealbum' element={<Albums />} />
            <Route path='/about' element={<About />} />
            <Route path='/raspberrycam' element={<RaspberryCam />} />
            <Route path='/folder/:id' element={<FolderContent isSignedIn={isSignedIn} />} />
          </Routes>
        </div>
    </UserProvider>
  );
}

export default App;