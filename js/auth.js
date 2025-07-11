// js/auth.js
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  signInAnonymously,
  linkWithCredential,
  EmailAuthProvider,
  sendEmailVerification, // YENİ EKLENDİ
  sendPasswordResetEmail, // YENİ EKLENDİ
  GoogleAuthProvider, // YENİ EKLENDİ
  signInWithPopup     // YENİ EKLENDİ
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { auth } from "./firebase.js";
import { getTranslation } from "./i18n.js";

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
  let userCredential;

  // Eğer kullanıcı anonim ise, hesabı bağlıyoruz
  if (currentUser && currentUser.isAnonymous) {
    const credential = EmailAuthProvider.credential(email, password);
    userCredential = await linkWithCredential(currentUser, credential);
  } else {
    // Değilse, yeni bir kullanıcı oluşturuyoruz
    userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
  }

  // Her iki durumda da, işlem başarılı olduktan sonra doğrulama e-postası gönderiyoruz
  if (userCredential.user) {
    sendEmailVerification(userCredential.user);
  }

  return userCredential; // Orijinal sonucu geri döndür
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

/**
 * Mevcut kullanıcıya doğrulama e-postasını yeniden gönderir.
 */
export function handleResendVerificationEmail() {
  if (auth.currentUser) {
    return sendEmailVerification(auth.currentUser);
  }
  return Promise.reject(new Error(getTranslation("auth_error_user_not_found")));
}

/**
 * Verilen e-posta adresine şifre sıfırlama linki gönderir.
 */
export function handlePasswordReset(email) {
  return sendPasswordResetEmail(auth, email);
}

/**
 * Google giriş penceresini açar ve giriş işlemini yönetir.
 */
export function handleGoogleSignIn() {
  const provider = new GoogleAuthProvider();
  return signInWithPopup(auth, provider);
}
