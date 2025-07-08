// js/main.
import { initSettingsMenu } from "./settings.js";
import { initializeI18n } from "./i18n.js";
import { initAuth, handleAnonymousSignIn } from "./auth.js";
import { loadMoviesFromFirestore, clearMovieLists } from "./storage.js";
import {
  showSection,
  setupListViewControls,
  updateProfileView,
} from "./sections.js";
import { setupEventListeners } from "./events.js";
import { handleMovieFormSubmit } from "./modals.js";
import { initBadgeInfoModal } from "./badge-modal.js";
import { initializeChatDOM } from "./chat.js";
import { initMovieSuggestion } from "./movie-suggestion.js";
import { showLoadingSpinner, hideLoadingSpinner } from "./modals.js";
import { fetchUserSubscriptionStatus, updateUIForSubscriptionStatus } from "./user.js"; // GÜNCELLEME
import { initPaywall } from './paywall.js'; // YENİ: import ekle


// YENİ: Verileri yüklenen mevcut kullanıcı ID'sini takip etmek için.
let currentLoadedUserId = null;

/**
 * Creates the animated background grid for the splash screen.
 */
function createSplashBackground() {
  const splashScreen = document.getElementById("splash-screen");
  if (!splashScreen) return;

  const gridContainer = document.createElement("div");
  gridContainer.id = "splash-background-grid";

  const posterUrls = [
    "https://image.tmdb.org/t/p/w500/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg", // The fight club
    "https://image.tmdb.org/t/p/w500/vseIVRdN4xasYwStQIi6SI7DcEu.jpg", // The Godfather
    "https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg", // The Dark Knight
    "https://image.tmdb.org/t/p/w500/AgY33Wtg4737MhYopJSFyKWhKsO.jpg", // Pulp Fiction
    "https://image.tmdb.org/t/p/w500/2rNjLWhb9hjv2ZmKAZVItjuJsCP.jpg", // Forrest Gump
    "https://image.tmdb.org/t/p/w500/8g1aqEKt80x1gbKqc8a1TWb9cr6.jpg", // The Matrix
    "https://image.tmdb.org/t/p/w500/4KAtscEx3Pt9YPpNuK3BO6irQn1.jpg", // Toystory
    "https://image.tmdb.org/t/p/w500/cVeJ2kQ9qZmpud57iSKsANyAsNp.jpg", // Shrek
    "https://image.tmdb.org/t/p/w500/hEntfzxB8yUXIxqZY929dELjLsi.jpg", // titanic
    "https://image.tmdb.org/t/p/w500/6oom5QYQ2yQTMJIbnvbkBL9cHo6.jpg", // LotR: Fellowship
    "https://image.tmdb.org/t/p/w500/46oFAcjORMltwPxR6uU6hM4mN7F.jpg", // Star Wars
    "https://image.tmdb.org/t/p/w500/yh5rAnhNiZz0nkWhbWw98MvdvBH.jpg", // Parasite XXXX
  ];

  // Repeat the array to have 24 posters for a seamless loop
  const repeatedUrls = [...posterUrls, ...posterUrls];

  repeatedUrls.forEach((url) => {
    const posterDiv = document.createElement("div");
    posterDiv.className = "splash-poster";
    posterDiv.style.backgroundImage = `url(${url})`;
    gridContainer.appendChild(posterDiv);
  });

  // Insert the grid as the first child of the splash screen
  splashScreen.prepend(gridContainer);
}

/**
 * Shows the main application UI and hides the splash screen.
 */
function showAppUI() {
  const splashScreen = document.getElementById("splash-screen");
  const mainContainer = document.getElementById("main-container");

  if (mainContainer.classList.contains("hidden")) {
    console.log("UI is not visible, showing it now...");
    mainContainer.classList.remove("hidden");
    showSection("my-watched-movies-section");

    splashScreen.classList.add("fade-out");
    splashScreen.addEventListener(
      "transitionend",
      () => (splashScreen.style.display = "none"),
      { once: true }
    );
  }
}

/**
 * Initializes the application.
 */
function initializeApp() {
  initializeI18n(); // DİL SİSTEMİNİ BAŞLAT
  initSettingsMenu(); // AYARLAR MENÜSÜNÜ BAŞLAT


  console.log("initializeApp: Starting application...");

  // Create the premium splash screen background
  createSplashBackground();

  // Gerekli tüm başlatmaları yap
  setupEventListeners();
  setupListViewControls();
  initBadgeInfoModal();
  initializeChatDOM();
  initMovieSuggestion();
  initPaywall();

  let isUiReady = false;

  initAuth(async (user) => {
    if (user) {
      if (user.uid !== currentLoadedUserId) {
        currentLoadedUserId = user.uid;
        showLoadingSpinner("Verileriniz yükleniyor...");
        try {
          await Promise.all([
            loadMoviesFromFirestore(user.uid),
            fetchUserSubscriptionStatus(user.uid)
          ]);

          // YENİ: Arayüzü kullanıcının durumuna göre güncelle
          updateUIForSubscriptionStatus();

        } catch (error) {
          console.error("Firestore'dan ilk veri yüklenirken hata oluştu:", error);
        } finally {
          hideLoadingSpinner();
        }
      }
      if (!isUiReady) {
        showAppUI();
        isUiReady = true;
      }
      updateProfileView(user);
    } else {
      console.log("Auth state changed. No user found. Signing in anonymously...");
      clearMovieLists();
      await fetchUserSubscriptionStatus(null);

      // YENİ: Arayüzü kullanıcının durumuna göre güncelle
      updateUIForSubscriptionStatus();

      updateProfileView(null);
      currentLoadedUserId = null;
      handleAnonymousSignIn().catch((err) => { /*...*/ });
    }
  });
}

document.addEventListener("DOMContentLoaded", initializeApp);