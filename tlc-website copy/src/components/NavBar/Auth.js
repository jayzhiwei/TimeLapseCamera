import React, { useState, useEffect } from "react";
import { auth } from '../../firebase/firebase.js';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged, signOut } from "firebase/auth";
import { Link, useMatch, useResolvedPath, useLocation } from "react-router-dom";
import { useContext } from 'react';
import { UserContext } from '../UserContext';
import { VscSignOut } from '../../images/Icons.js'

import "./Navbar.css"

const defaultProfileImage = 'https://firebasestorage.googleapis.com/v0/b/timelapsefyp2024.appspot.com/o/profile_pictures%2FdefaultProfileImg.png?alt=media&token=4f577cb6-cb51-4001-88c8-5b06ae63490e';

const Auth = () => {
    const navigate = useNavigate();
    const [ authenticatedUser, setAuthenticatedUser ] = useState("");
    const { userProfile } = useContext(UserContext);

    const location = useLocation();
    const handleGoPage = (e) => {
        if (location.pathname === "/home"){
            e.preventDefault();
            window.location.reload(); //refresh the page
        }
    }

    // Check if user authenticated
    useEffect(() => {
        const listenAuth = onAuthStateChanged(auth, (user) => {
            if (user) {
                setAuthenticatedUser(user); // Set the user's UID
                console.log(authenticatedUser);
            } else {
                setAuthenticatedUser(null); // User is not logged in
            }
        });

        // Cleanup subscription on unmount
        return () => { listenAuth(); }
    }, [])

    const userSignOut = () => {
        signOut(auth).then(() => {
            navigate("/");
            // console.log("User sign out");
        }).catch(error => "Sign out error")
    }

    return (
        <nav className="nav">
            {userProfile?.imageUrl && (
                <CustomLink to="/home" onClick={handleGoPage}>
                {/* <div onClick={handleGoPage}> */}
                    <img src={userProfile.imageUrl} alt={userProfile.name} className="user-image-NV" 
                    onLoad={() => console.log("Image loaded successfully.")}
                    onError={(e) => {
                    e.target.src = defaultProfileImage; // Fallback to default image on error
                    console.error("Error loading profile image.");}}/>
                {/* </div> */}
                </CustomLink>
            )}

            { authenticatedUser === null ?
                <CustomLink to="/" />:
                <CustomLink to="/" onClick = {userSignOut} className="icons">
                    <VscSignOut />
                </CustomLink>
            }
        </nav>
    );
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

export default Auth;