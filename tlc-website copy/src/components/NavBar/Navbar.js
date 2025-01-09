import { Link, useMatch, useResolvedPath } from "react-router-dom";
import logo from '../../images/logo.svg';
import { useContext } from 'react';
import { UserContext } from '../UserContext';
import './Navbar.css';

const defaultProfileImage = 'https://firebasestorage.googleapis.com/v0/b/timelapsefyp2024.appspot.com/o/profile_pictures%2FdefaultProfileImg.png?alt=media&token=4f577cb6-cb51-4001-88c8-5b06ae63490e';

export default function Navbar() {
    const { userProfile } = useContext(UserContext);
    return (
        <nav className="nav">
            <Link to="/" className="site-title">
                <img src={logo} className="App-logo" alt="logo"/>
            </Link>
            <div className="nav-links">
                <CustomLink to="/album"><i className="fas fa-images"></i><span>Albums</span></CustomLink>
                <CustomLink to="/film"><i className="fas fa-film"></i><span>Films</span></CustomLink>
                <CustomLink to="/myDevices"><i className="fas fa-video"></i><span>My Devices</span></CustomLink>
                <CustomLink to="/about"><i className="fas fa-info-circle"></i><span>About</span></CustomLink>
                {userProfile.imageUrl && (
                    <CustomLink to="/">
                        <img src={userProfile.imageUrl} alt={userProfile.name} className="user-image-NV" 
                        onLoad={() => console.log("Image loaded successfully.")}
                        onError={(e) => {
                          e.target.src = defaultProfileImage; // Fallback to default image on error
                          console.error("Error loading profile image.");}}/>
                    </CustomLink>
                )}
            </div>
        </nav>
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
