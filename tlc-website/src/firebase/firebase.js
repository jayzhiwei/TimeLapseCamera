// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAsK-n9-J3vzVEVWcBMRQ6PLtGhbA1CniI",
  authDomain: "timelapsefyp2024.firebaseapp.com",
  projectId: "timelapsefyp2024",
  storageBucket: "timelapsefyp2024.appspot.com",
  messagingSenderId: "649529788390",
  appId: "1:649529788390:web:9f0645debe5536fdbd3827",
  measurementId: "G-QM6VFJ108V"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const analytics = getAnalytics(app);

export {app, auth, analytics};