import React, { useEffect, useState, useContext } from 'react'; // Import useContext here
import { Route, Routes } from 'react-router-dom';
import Navbar from './Navbar';
import About from './pages/About';
import Albums from './pages/Album';
import Film from './pages/Film';
import Home from './pages/Home';
import RaspberryCam from './pages/RaspberryCam';
import FolderContent from './pages/FolderContent';
import { UserProvider, UserContext } from './pages/UserContext'; // Import UserContext here
import { auth } from './firebase/firebase';
import { onAuthStateChanged } from 'firebase/auth';

const defaultProfileImage = 'https://firebasestorage.googleapis.com/v0/b/timelapsefyp2024.appspot.com/o/profile_pictures%2FdefaultProfileImg.png?alt=media&token=d30677b9-e6f4-459d-bd54-070f5f3002cc';

function AppContent() {
  const { setUserProfile } = useContext(UserContext); // useContext is now defined
  const [isSignedIn, setIsSignedIn] = useState(false);

  useEffect(() => {
    // Check Firebase authentication state
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserProfile({
          uid: user.uid,
          name: user.displayName || user.email,
          imageUrl: user.photoURL || defaultProfileImage,
        });
        setIsSignedIn(true);
      } else {
        setIsSignedIn(false);
        setUserProfile({ uid: null, name: '', imageUrl: '' });
      }
    });

    // Clean up the listener on unmount
    return () => unsubscribe();
  }, [setUserProfile]);

  return (
    <>
      <Navbar />
      <div className='container'>
        <Routes>
          <Route path='/' element={<Home />} />
          <Route path='/googledrivealbum' element={<Albums />} />
          <Route path='/Film' element={<Film />} />
          <Route path='/about' element={<About />} />
          <Route path='/raspberrycam' element={<RaspberryCam />} />
          <Route path='/folder/:id' element={<FolderContent isSignedIn={isSignedIn} />} />
        </Routes>
      </div>
    </>
  );
}

function App() {
  return (
    <UserProvider>
      <AppContent />
    </UserProvider>
  );
}

export default App;