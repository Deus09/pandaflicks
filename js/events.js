// js/events.js
import { openMovieMode, closeMovieDetailsModal } from "./modals.js";
import { showSection } from "./sections.js";
import { showNotification } from "./utils.js";
import {
  handleSignIn,
  handleSignUp,
  handleSignOut,
  handlePasswordReset,
} from "./auth.js";
import { getTranslation } from "./i18n.js";

export function setupEventListeners() {
  // --- Navigasyon Olayları ---
  document
    .getElementById("nav-my-log")
    ?.addEventListener("click", () => showSection("my-watched-movies-section"));
  document
    .getElementById("nav-trending")
    ?.addEventListener("click", () => showSection("trending-movies-section"));
  document
    .getElementById("nav-lists")
    ?.addEventListener("click", () => showSection("special-lists-section"));
  document
    .getElementById("nav-watch-later")
    ?.addEventListener("click", () =>
      showSection("watch-later-movies-section")
    );
  document
    .getElementById("nav-profile")
    ?.addEventListener("click", () => showSection("profile-section"));
  document
    .getElementById("add-movie-float-button")
    ?.addEventListener("click", () => openMovieMode());

  // --- Profil ve Çıkış Yapma Olayları ---
  document
    .getElementById("sign-out-button")
    ?.addEventListener("click", handleSignOut);

  // --- Detay Modalı Kapatma Olayları ---
  const movieDetailsModalOverlay = document.getElementById(
    "movie-details-modal-overlay"
  );
  document
    .getElementById("close-detail-modal-button")
    ?.addEventListener("click", () => closeMovieDetailsModal());
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

    if (authTabLogin)
      authTabLogin.addEventListener("click", () => {
        authTabLogin.classList.add("active");
        authTabSignup.classList.remove("active");
        authSubmitButton.textContent = getTranslation("auth_submit_login");
        document.getElementById("forgot-password-link").style.display = "block";
        authErrorMessage.classList.add("hidden");
      });

    if (authTabSignup)
      authTabSignup.addEventListener("click", () => {
        authTabSignup.classList.add("active");
        authTabLogin.classList.remove("active");
        authSubmitButton.textContent = getTranslation("auth_submit_signup");
        document.getElementById("forgot-password-link").style.display = "none";
        authErrorMessage.classList.add("hidden");
      });

    if (authPasswordToggle)
      authPasswordToggle.addEventListener("click", () => {
        const isPassword = authPasswordInput.type === "password";
        authPasswordInput.type = isPassword ? "text" : "password";
        eyeOpenIcon?.classList.toggle("hidden", isPassword);
        eyeClosedIcon?.classList.toggle("hidden", !isPassword);
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
          showNotification(
            getTranslation("notification_login_success"),
            "success"
          );
        } else {
          const userCredential = await handleSignUp(email, password);
          showNotification(
            getTranslation("notification_verification_sent"),
            "success"
          );
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

  // Tüm plan seçeneklerini seç
  const planOptions = document.querySelectorAll(".plan-option");

  // Her bir seçeneğe tıklama olayı ekle
  planOptions.forEach((option) => {
    option.addEventListener("click", () => {
      // Önce tüm seçeneklerden 'selected' sınıfını kaldır
      planOptions.forEach((otherOption) => {
        otherOption.classList.remove("selected");
      });

      // Sadece tıklanan seçeneğe 'selected' sınıfını ekle
      option.classList.add("selected");
    });
  });

  // --- Şifremi Unuttum? Akışı ---
  const forgotPasswordLink = document.getElementById("forgot-password-link");
  const passwordResetModal = document.getElementById("password-reset-modal");
  const closeResetModalBtn = document.getElementById("close-reset-modal-btn");
  const passwordResetForm = document.getElementById("password-reset-form");
  const resetEmailInput = document.getElementById("reset-email-input");

  // "Şifremi Unuttum?" linkine tıklanınca modalı aç
  if (forgotPasswordLink) {
    forgotPasswordLink.addEventListener("click", (e) => {
      e.preventDefault();
      passwordResetModal.classList.remove("hidden");
      // Animasyonun düzgün çalışması için küçük bir gecikme ekliyoruz
      setTimeout(() => {
        passwordResetModal.classList.add("visible");
      }, 10);
    });
  }

  // Kapatma butonuna tıklanınca modalı kapat
  if (closeResetModalBtn) {
    closeResetModalBtn.addEventListener("click", () => {
      passwordResetModal.classList.remove("visible");
      // Animasyon bittiğinde display:none yapmak için
      passwordResetModal.addEventListener(
        "transitionend",
        () => {
          if (!passwordResetModal.classList.contains("visible")) {
            passwordResetModal.classList.add("hidden");
          }
        },
        { once: true }
      );
    });
  }

  // Form gönderilince...
  if (passwordResetForm) {
    passwordResetForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = resetEmailInput.value;
      if (email) {
        try {
          await handlePasswordReset(email);
          showNotification(
            getTranslation("notification_password_reset_sent"),
            "success"
          );
          closeResetModalBtn.click(); // Başarılı olunca kapatma butonunu tetikle
        } catch (error) {
          if (error.code === "auth/user-not-found") {
            showNotification(
              getTranslation("auth_error_user_not_found_for_reset"),
              "error"
            );
          } else {
            showNotification(error.message, "error");
          }
        }
      }
    });
  }
}

// Bu fonksiyon, global scopeda olmadığı için setupEventListeners içinde kalmalı
// veya bir yardımcı dosyaya (utils.js) taşınmalıdır.
function getFriendlyAuthError(error) {
  switch (error.code) {
    case "auth/invalid-email":
      return getTranslation("auth_error_invalid_email");
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return getTranslation("auth_error_wrong_password");
    case "auth/email-already-in-use":
      return getTranslation("auth_error_email_in_use");
    case "auth/weak-password":
      return getTranslation("auth_error_weak_password");
    default:
      return getTranslation("auth_error_default");
  }
}
