// js/events.js
import {openMovieMode,closeMovieDetailsModal} from "./modals.js";
import { showSection } from "./sections.js";
import { showNotification } from "./utils.js";
import { handleSignIn, handleSignUp, handleSignOut } from "./auth.js";

export function setupEventListeners() {
  // --- Navigasyon Olayları ---
  document.getElementById('nav-my-log')?.addEventListener('click', () => showSection('my-watched-movies-section'));
  document.getElementById('nav-trending')?.addEventListener('click', () => showSection('trending-movies-section'));
  document.getElementById('nav-lists')?.addEventListener('click', () => showSection('special-lists-section'));
  document.getElementById('nav-watch-later')?.addEventListener('click', () => showSection('watch-later-movies-section'));
  document.getElementById('nav-profile')?.addEventListener('click', () => showSection('profile-section'));
  document.getElementById('add-movie-float-button')?.addEventListener('click', () => openMovieMode());

  // --- Profil ve Çıkış Yapma Olayları ---
  document.getElementById('sign-out-button')?.addEventListener('click', handleSignOut);

  // --- Detay Modalı Kapatma Olayları ---
  const movieDetailsModalOverlay = document.getElementById("movie-details-modal-overlay");
  document.getElementById("close-detail-modal-button")?.addEventListener("click", () => closeMovieDetailsModal());
  if (movieDetailsModalOverlay) {
    movieDetailsModalOverlay.addEventListener("click", (e) => {
        if (e.target === movieDetailsModalOverlay) closeMovieDetailsModal();
    });
  }

  // --- Giriş/Kayıt Formu Olayları ---
  // Not: Bu bölüm, modal içeriği dinamik olarak oluşturulduğu için
  // ilgili modalın kendi modülünde (örn: modals.js) yönetilirse daha sağlam olur.
  // Ancak mevcut yapıya uygun olarak burada bırakılmıştır.
  const emailAuthForm = document.getElementById("email-auth-form");
  if (emailAuthForm) {
    const authTabLogin = document.getElementById("auth-tab-login");
    const authTabSignup = document.getElementById("auth-tab-signup");
    const authSubmitButton = document.getElementById("auth-submit-button");
    const authErrorMessage = document.getElementById("auth-error-message");
    const authEmailInput = document.getElementById("auth-email");
    const authEmailError = document.getElementById("auth-email-error");
    const authPasswordInput = document.getElementById("auth-password");
    const authPasswordToggle = document.getElementById("auth-password-toggle");
    const eyeOpenIcon = document.getElementById("eye-open-icon");
    const eyeClosedIcon = document.getElementById("eye-closed-icon");

    if (authTabLogin) authTabLogin.addEventListener("click", () => {
        authTabLogin.classList.add("active");
        authTabSignup.classList.remove("active");
        authSubmitButton.textContent = "Giriş Yap";
        authErrorMessage.classList.add("hidden");
    });

    if (authTabSignup) authTabSignup.addEventListener("click", () => {
        authTabSignup.classList.add("active");
        authTabLogin.classList.remove("active");
        authSubmitButton.textContent = "Kayıt Ol";
        authErrorMessage.classList.add("hidden");
    });
    
    if (authPasswordToggle) authPasswordToggle.addEventListener('click', () => {
        const isPassword = authPasswordInput.type === 'password';
        authPasswordInput.type = isPassword ? 'text' : 'password';
        eyeOpenIcon?.classList.toggle('hidden', isPassword);
        eyeClosedIcon?.classList.toggle('hidden', !isPassword);
    });

    emailAuthForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const email = authEmailInput.value;
        const password = authPasswordInput.value;
        const isLogin = authTabLogin.classList.contains("active");
        
        authErrorMessage.classList.add("hidden");
        authSubmitButton.disabled = true;

        try {
            if (isLogin) {
                await handleSignIn(email, password);
                showNotification("Başarıyla giriş yapıldı!", "success");
            } else {
                const userCredential = await handleSignUp(email, password);
                showNotification(`Hoş geldin, ${userCredential.user.email}! Hesabın başarıyla oluşturuldu.`, "success");
                emailAuthForm.reset();
            }
        } catch (error) {
            console.error("Authentication Error:", error);
            authErrorMessage.textContent = getFriendlyAuthError(error);
            authErrorMessage.classList.remove("hidden");
        } finally {
            authSubmitButton.disabled = false;
        }
    });
  }
}

// Bu fonksiyon, global scopeda olmadığı için setupEventListeners içinde kalmalı
// veya bir yardımcı dosyaya (utils.js) taşınmalıdır.
function getFriendlyAuthError(error) {
    switch (error.code) {
        case "auth/invalid-email":
            return "Lütfen geçerli bir e-posta adresi girin.";
        case "auth/user-not-found":
        case "auth/wrong-password":
        case "auth/invalid-credential":
            return "E-posta veya parola hatalı. Lütfen kontrol edin.";
        case "auth/email-already-in-use":
            return "Bu e-posta adresi zaten başka bir hesap tarafından kullanılıyor.";
        case "auth/weak-password":
            return "Parolanız en az 6 karakter uzunluğunda olmalıdır.";
        default:
            return "Bir hata oluştu. Lütfen daha sonra tekrar deneyin.";
    }
}