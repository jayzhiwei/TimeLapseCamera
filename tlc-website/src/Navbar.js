import { Link, useMatch, useResolvedPath } from "react-router-dom"
import logo from './logo.svg';
import { useContext } from 'react';
import { UserContext } from './pages/UserContext';
import './Navbar.css';

export default function Navbar() {
    const { userProfile } = useContext(UserContext);
    return (
        <nav className="nav">
            <Link to="/" className="site-title">
                <img src={logo} className="App-logo" alt="logo"/>
                </Link>
            <div className="nav-links">
                <CustomLink to="/googledrivealbum">Albums</CustomLink>
                <CustomLink to="/raspberrycam">Cameras</CustomLink>
                <CustomLink to="/about">About</CustomLink>
                {userProfile.imageUrl && (
                    <CustomLink to="/">
                        <img src={userProfile.imageUrl} alt={userProfile.name} className="user-image" />
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