import { Link, useLocation, useMatch, useResolvedPath } from "react-router-dom";
import logo from '../../images/logo.svg';
import { useState, useEffect } from 'react';
import { onAuthStateChanged } from "firebase/auth";
import { auth } from '../../firebase/firebase.js';
import Auth from "./Auth";
import { FaLink, FaCircleInfo } from "../../images/Icons.js"
import './Navbar.css';

// const defaultProfileImage = 'https://firebasestorage.googleapis.com/v0/b/timelapsefyp2024.appspot.com/o/profile_pictures%2FdefaultProfileImg.png?alt=media&token=4f577cb6-cb51-4001-88c8-5b06ae63490e';

export default function Navbar() {
    const  [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setIsLoggedIn(!!user); // Set true if user exists otherwise false
        });
    
        // Cleanup subscription on unmount
        return () => unsubscribe();
      }, []);
      const location = useLocation();
      const handleGoPage = (e) => {
          if (location.pathname === "/home"){
              e.preventDefault();
              window.location.reload(); //refresh the page
          }
      }
      

    return (
        <>
        {isLoggedIn ? (
            <nav className="nav">
                <Link to="/home" className="site-title" onClick={handleGoPage}>
                {/* <div onClick={refreshPage}> */}
                    <img src={logo} className="App-logo" alt="logo"/>
                {/* </div> */}
                </Link>
                <div className="nav-links">
                    {/* <CustomLink to="/album"> <i className="fas fa-image"></i> <span>Albums</span></CustomLink>
                    <CustomLink to="/film"> <i className="fas fa-film"></i> <span>Films</span></CustomLink> 
                    <CustomLink to="/myDevices"> <i className="fas fa-video"> </i><span>Devices</span></CustomLink>*/}
                    <CustomLink to="/PairDevices" className="icons"> <FaLink />&nbsp;Pair</CustomLink>
                    {/* <CustomLink to="/about" className="icons"><FaCircleInfo />&nbsp;About</CustomLink> */}
                    <Auth />
                </div>
            </nav>
            ):(<></>)}
        </>
    )
}

function CustomLink({ to, children, ...props }) {
    const resolvedPath = useResolvedPath(to)
    const isActive = useMatch({ path: resolvedPath.pathname, end: true })

    return (
        <Link to={to} {...props} className={isActive ? "active" : ""}>
            {children}
        </Link>
    )
}
