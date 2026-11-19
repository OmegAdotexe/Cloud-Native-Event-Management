
import {
    signInWithPopup,
    signOut
} from "firebase/auth";

import {
    auth,
    googleProvider
} from "../firebase/firebase";

// Google sign-in
export const signInWithGoogle = async () => {
    try {
        const result = await signInWithPopup(
            auth,
            googleProvider
        );

        const user = result.user;

        // Firebase ID token for backend verification
        const idToken = await user.getIdToken();

        return {
            success: true,
            idToken,
            user: {
                uid: user.uid,
                email: user.email,
                name: user.displayName,
                photoURL: user.photoURL
            }
        };

    } catch (error) {
        console.error("Google Sign-In Error:", error);

        throw error;
    }
};

// Firebase sign-out
export const signOutFromFirebase = async () => {
    await signOut(auth);
};
