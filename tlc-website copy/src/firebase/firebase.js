// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";
import { getStorage } from "firebase/storage";  // Get firebase storage
import { getFirestore } from "firebase/firestore";  // Get firebase database
import { getDatabase } from "firebase/database";  // Get firebase real time database

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
  measurementId: "G-QM6VFJ108V",
  databaseURL: "https://timelapsefyp2024-default-rtdb.asia-southeast1.firebasedatabase.app/"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export Firebase services
export const auth = getAuth(app);  // Firebase Authentication
export const storage = getStorage(app); // Firebase Storage
export const db = getFirestore(app);    // Firestore Database
export const analytics = getAnalytics(app);
export const realtimeDB = getDatabase(app); // Firebase realtime database

export default app;