import React, { useState } from 'react';
import { auth, db } from '../../firebase/firebase';
import { useNavigate } from 'react-router-dom';
import { doc, setDoc, getDoc } from "firebase/firestore";
import { createUserWithEmailAndPassword, sendEmailVerification, onAuthStateChanged } from "firebase/auth";
import ErrorMsg from '../ErrorMsg/ErrorMsg';
import Login from './Login';
import './Login.css';

const Register = () => {
    const navigate = useNavigate();
    const [error, setError] = useState(null);
    const [haveAcc, setHaveAcc] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [userEmailVerified, setuserEmailVerified] = useState(true)
    const isValidEmail = (email) => {const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    };
    const hasUpperCase = (str) => /[A-Z]/.test(str);
    const hasLowerCase = (str) => /[a-z]/.test(str);
    const hasNumber = (str) => /\d/.test(str);
    const hasSpecialChar = (str) =>  /[\W_]/.test(str);
    const isValidPassword = (pwd) => {
        return (
          pwd.length >= 12 &&
          hasUpperCase(pwd) &&
          hasLowerCase(pwd) &&
          hasNumber(pwd) &&
          hasSpecialChar(pwd)
        );
      };      

    // Function to poll for email verification status
    const pollEmailVerification = (user) => {
        const interval = setInterval(() => {
            user.reload().then(async() => {
            if (user.emailVerified) {
                setuserEmailVerified(true)
                clearInterval(interval); // Stop polling once verified
                // const updatedUser = auth.currentUser;
                // Automatically log the user in
            //   setUserProfile({
            //     name: updatedUser.displayName  || "New User",
            //     imageUrl: updatedUser.photoURL || defaultProfileImage,
            //   });
            //   setIsSignedIn(true);
                setError(null);
                console.log("User email verified, logged in automatically.");
                const unsubscribe = onAuthStateChanged(auth, (user) => {
                    if(user && user.emailVerified){
                        navigate('/home');
                        window.location.reload();
                    }
                    else
                        console.log('User exists but is not verified yet.');
                });
                return () => unsubscribe();
            }
            }).catch((error) => {
                console.error("Error reloading user:", error);
            });
        }, 5000); // Check every 5 seconds
    };
    
    // Email/Password Sign-Up with Confirmation and Email Verification
    const handleEmailSignUp = () => {
        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }
        createUserWithEmailAndPassword(auth, email, password)
            .then(async(result) => {
            const user = result.user;
            // Check if user document exists, if not create it
            const userDocRef = doc(db, "users", user.uid);
            const userDocSnap = await getDoc(userDocRef);
            if (!userDocSnap.exists()) {
                await setDoc(userDocRef, {
                email: user.email,
                name: user.displayName || "New User",
                createdAt: new Date(),
                });

                // setUserProfile({
                //   name: user.displayName,
                //   imageUrl: user.photoURL || defaultProfileImage,
                // });

                console.log("New user document created.");
            }

            sendEmailVerification(user)
            .then(() => {
                setError("Verification email sent. Please check your inbox.");
                setuserEmailVerified(false)
                pollEmailVerification(user);
            })
            .catch((error) => {
                console.error("Error sending verification email:", error);
                setError("Error sending verification email: " + error.message);
            });
        //   setIsSignedIn(false); // Don't sign in immediately; wait for email verification
        })
        .catch((error) => {
            console.error("Error signing up:", error);
            setError("Error signing up: " + error.message);
        });
    };

    return (
        <>
            {!haveAcc ? (
                <div className='App-content'>
                    <ErrorMsg error = {error} />
                    <h1>Register</h1>
                    <div className="form">
                        <div className="email">
                            <input
                                type="email"
                                placeholder="Email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="input"
                            />
                            {/* Validate email input */}
                            {email !== "" && (
                                <span className={isValidEmail(email) ? "" : "errorMsg"}>
                                    {isValidEmail(email)
                                        ? "✅ Valid email address"
                                        : "❌ Please enter a valid email address"}
                                </span>
                            )}
                        </div>

                        <div className='password'>
                            <input
                                type="password"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="input"
                                autoComplete="new-password"
                            />
                            {/* Validate password */}
                            {password !== "" && (
                                <div className="password-requirements">
                                    <p className={hasUpperCase(password) ? "valid" : "invalid"}>
                                        {hasUpperCase(password) ? "✅" : "❌"} Require uppercase character
                                    </p>
                                    <p className={hasLowerCase(password) ? "valid" : "invalid"}>
                                        {hasLowerCase(password) ? "✅" : "❌"} Require lowercase character
                                    </p>
                                    <p className={hasSpecialChar(password) ? "valid" : "invalid"}>
                                        {hasSpecialChar(password) ? "✅" : "❌"} Require special character
                                    </p>
                                    <p className={hasNumber(password) ? "valid" : "invalid"}>
                                        {hasNumber(password) ? "✅" : "❌"} Require numeric character
                                    </p>
                                    <p className={password.length >= 12 ? "valid" : "invalid"}>
                                        {password.length >= 12 ? "✅" : "❌"} Must be at least 12 characters long
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className='comfirm-password'>
                            <input
                                type="password"
                                placeholder="Confirm Password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="input"
                                autoComplete="new-password"
                            />
                            {/* Validate confirm password */}
                            {confirmPassword !== "" && (
                                <span className={password === confirmPassword ? "" : "errorMsg"}>
                                {password === confirmPassword
                                    ? "✅ Passwords match"
                                    : "❌ Passwords do not match"}
                                </span>
                            )}
                        </div>

                        <button
                            className='loginSignUpbutton'
                            onClick={handleEmailSignUp}
                            disabled={
                                !userEmailVerified || !isValidEmail(email) || !isValidPassword(password) || confirmPassword !== password
                            }
                            style={{
                                opacity:
                                !userEmailVerified || !isValidEmail(email) || !isValidPassword(password) || confirmPassword !== password
                                    ? 0.5
                                    : 1,
                                cursor:
                                !userEmailVerified || !isValidEmail(email) || !isValidPassword(password) || confirmPassword !== password
                                    ? "not-allowed"
                                    : "pointer",
                            }}
                        >
                            Sent Verification Email
                        </button>
                        <p className="toggle-text" onClick={() => setHaveAcc(!haveAcc)}>
                            Already have an account? Sign in
                        </p>
                    </div>
                </div>
            ):(
                <Login />
            )}
        </>
    )
};
export default Register;