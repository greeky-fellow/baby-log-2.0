import { initializeApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getAuth, type Auth } from 'firebase/auth';

// --- CONFIGURATION START ---

// 1. PASTE YOUR FIREBASE CONFIG HERE
export const firebaseConfig = {
    apiKey: "AIzaSyDyYceoNZMYoxKN_LFhzUddiHaANupFprk",
    authDomain: "babylog-00.firebaseapp.com",
    projectId: "babylog-00",
    storageBucket: "babylog-00.firebasestorage.app",
    messagingSenderId: "181906458576",
    appId: "1:181906458576:web:86eecdc76188eb23eb9bd5"
};

// --- CONFIGURATION END ---

// Initialize Firebase safely
let app;
export let auth: Auth;
export let db: Firestore;
export let configMissing = false;

if (firebaseConfig.apiKey === "PASTE_API_KEY_HERE") {
    configMissing = true;
} else {
    try {
        app = initializeApp(firebaseConfig);
        auth = getAuth(app);
        db = getFirestore(app);
    } catch (e) {
        console.error("Firebase init error:", e);
    }
}

export const appId = 'baby-log-v1';
