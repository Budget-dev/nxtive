// Firebase CLIENT SDK — safe for browser. Uses NEXT_PUBLIC_* env vars.
// Initializes app, auth, firestore, storage, and analytics for client-side use.

import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";
import { getAnalytics, Analytics, isSupported } from "firebase/analytics";
import { getFunctions, Functions } from "firebase/functions";

export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyAWwaVSLhQcj6QS_Nm3OWZmQ2WSdQyTyMQ",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "nxtive-80349.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "nxtive-80349",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "nxtive-80349.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "362396170752",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:362396170752:web:4b4da6e1e3e8f1ab56f6e5",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-LG8KMK4S3Q",
};

// Initialize Firebase once across client hot-reloads
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions: Functions = getFunctions(app);

let analytics: any = null;
if (typeof window !== "undefined") {
  isSupported()
    .then((supported: boolean) => {
      if (supported) {
        analytics = getAnalytics(app);
      }
    })
    .catch(() => {
      // Analytics might not be supported in certain browser modes (e.g. cookies disabled)
    });
}

export { analytics };
