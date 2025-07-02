// js/events.js
import {
  openMovieMode,
  closeMovieMode,
  openMovieDetailsModal,
  closeMovieDetailsModal,
} from "./modals.js";
import { searchTmdbMovies } from "./api.js";
import { displayTmdbSearchResults } from "./render.js";
import { setupStarRating } from "./rating.js";
import { enhanceCommentWithGemini } from "./gemini.js";
import { showSection } from "./sections.js";
import { showNotification } from "./utils.js";
import { handleSignIn, handleSignUp, handleSignOut } from "./auth.js";

export function setupEventListeners() {
  // Tüm elementleri seç
  const movieModalOverlay = document.getElementById("movie-modal-overlay");
  const addMovieFloatButton = document.getElementById("add-movie-float-button");
  const movieDetailsModalOverlay = document.getElementById(
    "movie-details-modal-overlay"
  );
  const closeDetailModalButton = document.getElementById(
    "close-detail-modal-button"
  );
  const movieTitleInput = document.getElementById("movie-title-input");
  const movieCommentInput = document.getElementById("movie-comment-input");
  const enhanceCommentButton = document.getElementById(
    "enhance-comment-button"
  );
  const tmdbSearchResultsDiv = document.getElementById("tmdb-search-results");
  const tmdbSearchMessage = document.getElementById("tmdb-search-message");
  const movieDateInput = document.getElementById("movie-date-input");
  const movieRatingInputDiv = document.getElementById("movie-rating-input");
  const watchLaterCheckbox = document.getElementById("watch-later-checkbox");
  const cancelButton = document.getElementById("cancel-button");
  const signOutButton = document.getElementById("sign-out-button");
  const emailAuthForm = document.getElementById("email-auth-form");
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
  let tmdbSearchTimeout;

  // Her bir olay dinleyicisini eklemeden önce elementin varlığını kontrol et

  // Navigasyon
  const navMyLog = document.getElementById("nav-my-log");
  if (navMyLog)
    navMyLog.addEventListener("click", () =>
      showSection("my-watched-movies-section")
    );

  const navTrending = document.getElementById("nav-trending");
  if (navTrending)
    navTrending.addEventListener("click", () =>
      showSection("trending-movies-section")
    );

  const navLists = document.getElementById("nav-lists");
  if (navLists)
    navLists.addEventListener("click", () =>
      showSection("special-lists-section")
    );

  const navWatchLater = document.getElementById("nav-watch-later");
  if (navWatchLater)
    navWatchLater.addEventListener("click", () =>
      showSection("watch-later-movies-section")
    );

  const navProfile = document.getElementById("nav-profile");
  if (navProfile)
    navProfile.addEventListener("click", () => showSection("profile-section"));

  if (signOutButton) signOutButton.addEventListener("click", handleSignOut);
  if (addMovieFloatButton)
    addMovieFloatButton.addEventListener("click", () => openMovieMode());

  // Modallar
  if (cancelButton)
    cancelButton.addEventListener("click", () =>
      closeMovieMode(movieModalOverlay)
    );
  if (movieModalOverlay)
    movieModalOverlay.addEventListener("click", (e) => {
      if (e.target === movieModalOverlay) closeMovieMode(movieModalOverlay);
    });

  if (closeDetailModalButton)
    closeDetailModalButton.addEventListener("click", () =>
      closeMovieDetailsModal()
    );
  if (movieDetailsModalOverlay)
    movieDetailsModalOverlay.addEventListener("click", (e) => {
      if (e.target === movieDetailsModalOverlay) closeMovieDetailsModal();
    });

  // Giriş/Kayıt Formu
  if (authEmailInput) {
    authEmailInput.addEventListener("input", () => {
      const email = authEmailInput.value;
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (emailRegex.test(email) || email === "") {
        authEmailError.classList.add("hidden");
        authEmailInput.parentElement.classList.remove("invalid");
      } else {
        authEmailError.classList.remove("hidden");
        authEmailInput.parentElement.classList.add("invalid");
      }
    });
  }

  if (authPasswordToggle) {
    authPasswordToggle.addEventListener("click", () => {
      const isPassword = authPasswordInput.type === "password";
      authPasswordInput.type = isPassword ? "text" : "password";
      if (eyeOpenIcon) eyeOpenIcon.classList.toggle("hidden", isPassword);
      if (eyeClosedIcon) eyeClosedIcon.classList.toggle("hidden", !isPassword);
    });
  }

  if (emailAuthForm) {
    if (authTabLogin)
      authTabLogin.addEventListener("click", () => {
        authTabLogin.classList.add("active");
        authTabSignup.classList.remove("active");
        authSubmitButton.textContent = "Giriş Yap";
        authErrorMessage.classList.add("hidden");
      });

    if (authTabSignup)
      authTabSignup.addEventListener("click", () => {
        authTabSignup.classList.add("active");
        authTabLogin.classList.remove("active");
        authSubmitButton.textContent = "Kayıt Ol";
        authErrorMessage.classList.add("hidden");
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
          // Giriş yapma mantığı aynı kalıyor
          await handleSignIn(email, password);
          showNotification("Başarıyla giriş yapıldı!", "success");
        } else {
          // Kayıt olma mantığı İYİLEŞTİRİLDİ
          const userCredential = await handleSignUp(email, password);
          // Artık kullanıcıyı sistemden atmıyoruz.
          // Firebase, kayıt sonrası kullanıcıyı zaten "giriş yapmış" kabul eder.
          showNotification(
            `Hoş geldin, ${userCredential.user.email}! Hesabın başarıyla oluşturuldu.`,
            "success"
          );
          // Formu sıfırlayıp modalı kapatabilir veya doğrudan ana ekrana yönlendirebiliriz.
          // Şimdilik formu sıfırlayalım ve kullanıcı modalı kendi kapatabilir.
          emailAuthForm.reset();
        }
      } catch (error) {
        console.error("Authentication Error:", error);
        // DÜZELTME: Eksik olan satır buraya eklendi.
        authErrorMessage.textContent = getFriendlyAuthError(error);
        authErrorMessage.classList.remove("hidden");
      } finally {
        authSubmitButton.disabled = false;
      }
    });
  }

  if (watchLaterCheckbox) {
    watchLaterCheckbox.addEventListener("change", () => {
      // ... (checkbox mantığı aynı kalır)
    });
  }

  if (movieTitleInput) {
    movieTitleInput.addEventListener("input", () => {
      if (movieTitleInput.readOnly) return;
      clearTimeout(tmdbSearchTimeout);
      tmdbSearchTimeout = setTimeout(() => {
        searchTmdbMovies(
          movieTitleInput.value,
          tmdbSearchResultsDiv,
          tmdbSearchMessage,
          displayTmdbSearchResults
        );
      }, 300);
    });
  }

  if (enhanceCommentButton) {
    enhanceCommentButton.addEventListener("click", async () => {
      const currentComment = movieCommentInput.value.trim();
      if (currentComment.length < 10) {
        showNotification(
          "Lütfen yorumunuzu geliştirmek için en az 10 karakter girin.",
          "error"
        );
        return;
      }
      await enhanceCommentWithGemini(
        currentComment,
        movieTitleInput.value,
        movieCommentInput,
        enhanceCommentButton
      );
    });
  }

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

  watchLaterCheckbox.addEventListener("change", () => {
    const ratingGroup = movieRatingInputDiv.parentElement;
    const watchedDateGroup = document.getElementById("watched-date-group");
    const chatWithCharacterButton = document.getElementById(
      "chat-with-character-button"
    );
    const hasTmdbId = !!document.getElementById("movie-tmdb-id").value;

    if (watchLaterCheckbox.checked) {
      movieDateInput.disabled = true;
      movieDateInput.required = false;
      watchedDateGroup.style.display = "none";
      ratingGroup.style.display = "none";
      movieRatingInputDiv.innerHTML = "";
      enhanceCommentButton.style.display = "none";
      chatWithCharacterButton.classList.add("hidden"); // DÜZELTME
    } else {
      movieDateInput.disabled = false;
      movieDateInput.required = true;
      watchedDateGroup.style.display = "block";
      ratingGroup.style.display = "block";
      setupStarRating(movieRatingInputDiv, 0);
      enhanceCommentButton.style.display = "block";
      if (hasTmdbId) {
        // DÜZELTME
        chatWithCharacterButton.classList.remove("hidden");
      }
    }
  });

  movieTitleInput.addEventListener("input", () => {
    if (movieTitleInput.readOnly) return;
    clearTimeout(tmdbSearchTimeout);
    tmdbSearchTimeout = setTimeout(() => {
      searchTmdbMovies(
        movieTitleInput.value,
        tmdbSearchResultsDiv,
        tmdbSearchMessage,
        displayTmdbSearchResults
      );
    }, 300);
  });

  enhanceCommentButton.addEventListener("click", async () => {
    const currentComment = movieCommentInput.value.trim();
    if (currentComment.length < 10) {
      showNotification(
        "Lütfen yorumunuzu geliştirmek için en az 10 karakter girin.",
        "error"
      );
      return;
    }
    await enhanceCommentWithGemini(
      currentComment,
      movieTitleInput.value,
      movieCommentInput,
      enhanceCommentButton
    );
  });
}
