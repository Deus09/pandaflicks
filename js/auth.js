// js/auth.js
import { 
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut, 
    onAuthStateChanged, 
    signInAnonymously,
    linkWithCredential,
    EmailAuthProvider
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { auth } from './firebase.js';

/**
 * Sets up the listener for authentication state changes.
 * @param {function} callback - The function to call when the auth state changes.
 */
export function initAuth(callback) {
    onAuthStateChanged(auth, callback);
}

/**
 * Signs in a user anonymously.
 * @returns {Promise<UserCredential>}
 */
export function handleAnonymousSignIn() {
    return signInAnonymously(auth);
}

/**
 * Creates a new user account with email and password.
 * @param {string} email - The user's email.
 * @param {string} password - The user's password.
 * @returns {Promise<UserCredential>}
 */
export async function handleSignUp(email, password) {
    const currentUser = auth.currentUser;
    // If the user is currently anonymous, create a credential and link it.
    if (currentUser && currentUser.isAnonymous) {
        const credential = EmailAuthProvider.credential(email, password);
        return linkWithCredential(currentUser, credential);
    }
    // Otherwise, create a new user.
    return createUserWithEmailAndPassword(auth, email, password);
}

/**
 * Signs in an existing user with email and password.
 * @param {string} email - The user's email.
 * @param {string} password - The user's password.
 * @returns {Promise<UserCredential>}
 */
export function handleSignIn(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
}

/**
 * Signs out the current user.
 * @returns {Promise<void>}
 */
export function handleSignOut() {
    return signOut(auth);
}
