import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyChOH5iOLEWeHAo-u6zXIFdc1KTXy-exo4",
  authDomain: "lightingcontrol-84527.firebaseapp.com",
  projectId: "lightingcontrol-84527",
  storageBucket: "lightingcontrol-84527.firebasestorage.app",
  messagingSenderId: "697290886932",
  appId: "1:697290886932:web:0511266bded938929a7c01",
  measurementId: "G-FNJT8G4PMX",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let analytics;
if (typeof window !== "undefined") {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });
}

export { app, auth, db };