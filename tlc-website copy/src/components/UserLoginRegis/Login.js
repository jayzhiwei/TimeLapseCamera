import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// , createUserWithEmailAndPassword, sendEmailVerification, updateProfile 
import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signInWithEmailAndPassword} from "firebase/auth";
import { auth, db } from '../../firebase/firebase';
import { doc, setDoc, getDoc } from "firebase/firestore";
import ErrorMsg from '../ErrorMsg/ErrorMsg';
import SignUp from './Register';
import './Login.css';

const Login = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [isRegistering, setIsRegistering] = useState(false);
    // const  [isLoggedIn, setIsLoggedIn] = useState(false);

    const isValidEmail = (email) => {const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);};

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if(user && user.emailVerified)
                navigate('/home');
            else
                console.log('User exists but is not verified yet.');
        });
    
        // Cleanup subscription on unmount
        return () => unsubscribe();
    });

    // Google Sign-In
    const handleGoogleSignIn = () => {
        const provider = new GoogleAuthProvider();
        signInWithPopup(auth, provider)
        .then(async(result) => {
            const user = result.user;
            // setIsSignedIn(true);
            setError(null);

            // Check if user document exists, if not create it
            const userDocRef = doc(db, "users", user.uid);
            const userDocSnap = await getDoc(userDocRef);
            if (!userDocSnap.exists()) {
                await setDoc(userDocRef, {
                    email: user.email,
                    name: user.displayName || "New User",
                        createdAt: new Date(),
                });

                console.log("New user document created.");
            }
            navigate('/home');
        })
        .catch((error) => {
            console.error("Error signing in:", error);
            setError("Error signing in " + error.message);
        });
    };

    // Email/Password Sign-In
    const handleEmailSignIn = () => {
        signInWithEmailAndPassword(auth, email, password)
        .then(async(result) => {
            const user = result.user;
            if (user.emailVerified) {
                setError(null);
            } else {
                setError("Please verify your email before signing in.");
            }
            navigate('/home');
        })
        .catch((error) => {
            console.error("Error signing in:", error);
            setError("Error signing in: " + error.message);
        });
    };
    
    return (
        <div className='app-page'>
            {!isRegistering ? (
                <div className='App-content'>
                    <ErrorMsg error = {error} />
                    <h1>Login</h1>
                    <div className="form">
                        <div className="email">
                            <input
                                type="email"
                                placeholder="Email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="input"
                            />
                        </div>
                        
                        <div className="password">
                            <input
                                type="password"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="input"
                            />
                        </div>
                    
                        <button
                            className='loginSignUpbutton'
                            onClick={handleEmailSignIn}
                            disabled={!isValidEmail(email) || password.length < 6}
                            style={{
                                opacity: !isValidEmail(email) || password.length < 6 ? 0.5 : 1,
                                cursor: !isValidEmail(email) || password.length < 6 ? "not-allowed" : "pointer",
                            }}
                        >
                            Sign In
                        </button>

                        <button onClick={handleGoogleSignIn} className="google-button">
                            <img
                                src="https://developers.google.com/identity/images/g-logo.png"
                                alt="Google logo"
                                className="google-logo"
                            />
                            Sign in with Google
                        </button>
                        <p className="toggle-text" onClick={() => setIsRegistering(!isRegistering)}>
                            Don't have an account? Sign Up
                        </p>
                    </div>
                </div>
            ) : (
                <SignUp />
            )}
        </div>
        
    );
};

export default Login;