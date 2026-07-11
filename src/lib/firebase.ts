import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyCraLJXyQecJVmNnUta0rKFeVUFbwM5osA",
    authDomain: "evtime.firebaseapp.com",
    projectId: "evtime",
    storageBucket: "evtime.firebasestorage.app",
    messagingSenderId: "55677798741",
    appId: "1:55677798741:web:ddd6eb4961ab0a5bb807dc",
    measurementId: "G-V4KPDTDFVK"
};

// Initialize Firebase only if it hasn't been initialized yet (avoids Next.js HMR issues)
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
