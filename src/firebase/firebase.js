
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCAOXQckn5TEquYOA2tJCvgcdf5g2cK46c",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "campusconnect-bced1.firebaseapp.com",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "campusconnect-bced1",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "campusconnect-bced1.firebasestorage.app",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "378597656051",
    appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:378597656051:web:9d4e29f209968cadecbe86",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

export const googleProvider = new GoogleAuthProvider();

googleProvider.setCustomParameters({
    prompt: "select_account",
});
