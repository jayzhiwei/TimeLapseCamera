import React, { useState } from 'react';
import { auth, db } from '../../firebase/firebase';
import { doc, setDoc, getDoc } from "firebase/firestore";
import { createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import ErrorMsg from '../ErrorMsg/ErrorMsg';
import Login from './Login';

const Register = () => {
    const [error, setError] = useState(null);
    const [haveAcc, setHaveAcc] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const isValidEmail = (email) => {const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    };

    // Function to poll for email verification status
    const pollEmailVerification = (user) => {
        const interval = setInterval(() => {
            user.reload().then(async() => {
            if (user.emailVerified) {
                clearInterval(interval); // Stop polling once verified
                const updatedUser = auth.currentUser;
                // Automatically log the user in
            //   setUserProfile({
            //     name: updatedUser.displayName  || "New User",
            //     imageUrl: updatedUser.photoURL || defaultProfileImage,
            //   });
            //   setIsSignedIn(true);
                setError(null);
                console.log("User email verified, logged in automatically.");
                
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
            <ErrorMsg error = {error} />
            {!haveAcc ? (
                <div>
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
                            />
                            {/* Validate password */}
                            {password !== "" && (
                                <span className={password.length >= 6 ? "" : "errorMsg"}>
                                {password.length >= 6
                                    ? "✅ Password is valid"
                                    : "❌ Password must be at least 6 characters"}
                                </span>
                            )}
                        </div>

                        <div className='comfirm-password'>
                            <input
                                type="password"
                                placeholder="Confirm Password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="input"
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
                                !isValidEmail(email) || password.length < 6 || confirmPassword !== password
                            }
                            style={{
                                opacity:
                                !isValidEmail(email) || password.length < 6 || confirmPassword !== password
                                    ? 0.5
                                    : 1,
                                cursor:
                                !isValidEmail(email) || password.length < 6 || confirmPassword !== password
                                    ? "not-allowed"
                                    : "pointer",
                            }}
                        >
                            Sign Up
                        </button>
                        <p className="toggle-text" onClick={() => setHaveAcc(!haveAcc)}>
                            Already have an account? Sign In
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