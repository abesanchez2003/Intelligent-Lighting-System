// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyChOH5iOLEWeHAo-u6zXIFdc1KTXy-exo4",
  authDomain: "lightingcontrol-84527.firebaseapp.com",
  projectId: "lightingcontrol-84527",
  storageBucket: "lightingcontrol-84527.firebasestorage.app",
  messagingSenderId: "697290886932",
  appId: "1:697290886932:web:0511266bded938929a7c01",
  measurementId: "G-FNJT8G4PMX"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

let analytics;
if (typeof window !== "undefined") {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });
}

export { app, auth, db }