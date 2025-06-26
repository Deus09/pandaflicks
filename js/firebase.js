// js/firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Firebase yapılandırmanızı doğrudan buraya girin.
const firebaseConfig = {
  apiKey: "AIzaSyDAyKiJAWHz1AlTpUSfxXs5LKPU7UhuUYc",
  authDomain: "sinelog-574c7.firebaseapp.com",
  projectId: "sinelog-574c7",
  storageBucket: "sinelog-574c7.firebasestorage.app",
  messagingSenderId: "59986017154",
  appId: "1:59986017154:web:b986101e950cb53072ad9b",
  measurementId: "G-VMLTSMN4MH"
};

// Firebase'i başlat
const app = initializeApp(firebaseConfig);

// Firebase servislerini dışa aktar
export const auth = getAuth(app);
export const db = getFirestore(app);