// js/modals.js
import {
  TMDB_IMAGE_BASE_URL_W92,
  TMDB_IMAGE_BASE_URL_W500,
  YOUTUBE_EMBED_URL,
  fetchMovieDetailsFromApi,
  searchTmdbMovies,
} from "./api.js";
import { setupStarRating, setCurrentRating, currentRating } from "./rating.js";
import {
  saveMovie,
  deleteMovieFromList,
  watchedMovies,
  watchLaterMovies,
} from "./storage.js";
import { showSection } from "./sections.js";
import { showNotification } from "./utils.js";
import { enhanceCommentWithGemini } from "./gemini.js";
import { displayTmdbSearchResults } from "./render.js";
import { handleOpenCharacterSelection } from './chat.js';
// GÜNCELLEME: Gerekli fonksiyonları user.js ve paywall.js'den import ediyoruz
import { isUserPro, updateUIForSubscriptionStatus } from './user.js';
import { showPaywall } from './paywall.js';


// --- MODAL ELEMENT REFERANSLARI ---
let movieModalOverlay,
  modalTitle,
  movieIdInput,
  movieTmdbIdInput,
  movieTypeInput,
  movieTitleInput,
  moviePosterInput,
  movieRatingInputDiv,
  watchLaterCheckbox,
  watchedDateGroup,
  movieDateInput,
  movieCommentInput,
  enhanceCommentButton,
  chatWithCharacterButton,
  tmdbSearchResultsDiv,
  tmdbSearchMessage,
  movieRuntimeInput,
  movieGenresInput,
  movieDirectorInput,
  movieDetailsModalOverlay,
  detailModalTitle,
  detailModalBody,
  detailLottieLoader,
  detailMoviePoster,
  detailMovieReleaseDate,
  detailMovieGenres,
  detailMovieDirector,
  detailMovieOverview,
  detailMovieTrailerSection,
  detailMovieTrailerIframe,
  detailAddToLogButton,
  movieForm;

let isModalInitialized = false;

function initializeMovieModal() {
    if (isModalInitialized) return;

    const overlay = document.getElementById("movie-modal-overlay");
    if (!overlay) return;

    const modalContent = document.createElement("div");
    modalContent.className = "modal-content";
    // GÜNCELLEME: Pro butonlarına .pro-feature sınıfı ve PRO etiketi eklendi.
    modalContent.innerHTML = `
        <div class="modal-header"><h2 id="modal-title"></h2></div>
        <form id="movie-form" novalidate>
            <input type="hidden" id="movie-id" /><input type="hidden" id="movie-tmdb-id" /><input type="hidden" id="movie-type" /><input type="hidden" id="movie-runtime-input" /><input type="hidden" id="movie-genres-input" /><input type="hidden" id="movie-director-input" />
            <div class="form-group">
                <label for="movie-title-input">Film Adı:</label>
                <input type="text" id="movie-title-input" required placeholder="Film adı yazmaya başlayın..." />
                <div id="tmdb-search-results" class="tmdb-search-results hidden"></div>
                <p id="tmdb-search-message" class="tmdb-search-message" style="display: none;"></p>
            </div>
            <input type="hidden" id="movie-poster-input" />
            <div class="form-group"><label for="movie-rating-input">Puanınız:</label><div id="movie-rating-input" class="rating-input"></div></div>
            <label class="toggle-switch-container"><span class="toggle-switch-label">Daha Sonra İzle</span><div class="toggle-switch-wrapper"><input type="checkbox" id="watch-later-checkbox" /><span class="toggle-switch-slider"></span></div></label>
            <div class="form-group" id="watched-date-group"><label for="movie-date-input">İzleme Tarihi:</label><input type="date" id="movie-date-input" value="" required /></div>
            <div class="form-group">
                <label for="movie-comment-input">Yorumunuz:</label>
                <textarea id="movie-comment-input" rows="3" placeholder="Filme dair düşüncelerinizi buraya yazın..."></textarea>
                <div class="form-buttons-group">
                    <button type="button" id="enhance-comment-button" class="enhance-comment-button pro-feature"><span class="loading-spinner"></span><span class="button-text">✨ Yorumumu Geliştir<span class="pro-badge">PRO</span></span></button>
                    <button type="button" id="chat-with-character-button" class="chat-character-button hidden pro-feature"><span class="loading-spinner"></span><span class="button-text">🎭 Karakterle Sohbet Et<span class="pro-badge">PRO</span></span></button>
                </div>
            </div>
            <div class="modal-actions">
                <button type="button" id="cancel-button" class="cancel-button">İptal</button>
                <button type="submit" id="save-button" class="save-button">Kaydet</button>
            </div>
        </form>
    `;
    overlay.appendChild(modalContent);

    movieModalOverlay = overlay;
    modalTitle = document.getElementById("modal-title");
    movieIdInput = document.getElementById("movie-id");
    movieTmdbIdInput = document.getElementById("movie-tmdb-id");
    movieTypeInput = document.getElementById("movie-type");
    movieTitleInput = document.getElementById("movie-title-input");
    moviePosterInput = document.getElementById("movie-poster-input");
    movieRatingInputDiv = document.getElementById("movie-rating-input");
    watchLaterCheckbox = document.getElementById("watch-later-checkbox");
    watchedDateGroup = document.getElementById("watched-date-group");
    movieDateInput = document.getElementById("movie-date-input");
    movieCommentInput = document.getElementById("movie-comment-input");
    enhanceCommentButton = document.getElementById("enhance-comment-button");
    chatWithCharacterButton = document.getElementById("chat-with-character-button");
    tmdbSearchResultsDiv = document.getElementById("tmdb-search-results");
    tmdbSearchMessage = document.getElementById("tmdb-search-message");
    movieRuntimeInput = document.getElementById("movie-runtime-input");
    movieGenresInput = document.getElementById("movie-genres-input");
    movieDirectorInput = document.getElementById("movie-director-input");
    movieForm = document.getElementById("movie-form");

    movieForm.addEventListener("submit", handleMovieFormSubmit);
    document.getElementById("cancel-button").addEventListener("click", () => closeMovieMode());
    movieModalOverlay.addEventListener("click", (e) => {
        if (e.target === movieModalOverlay) closeMovieMode();
    });

    let tmdbSearchTimeout;

    watchLaterCheckbox.addEventListener("change", () => {
        const ratingGroup = movieRatingInputDiv.parentElement;
        const hasTmdbId = !!movieTmdbIdInput.value;
        
        if (watchLaterCheckbox.checked) {
            movieDateInput.disabled = true;
            movieDateInput.required = false;
            watchedDateGroup.style.display = "none";
            ratingGroup.style.display = "none";
            movieRatingInputDiv.innerHTML = "";
            enhanceCommentButton.style.display = "none";
            chatWithCharacterButton.classList.add("hidden");
        } else {
            movieDateInput.disabled = false;
            movieDateInput.required = true;
            watchedDateGroup.style.display = "block";
            ratingGroup.style.display = "block";
            setupStarRating(movieRatingInputDiv, 0);
            enhanceCommentButton.style.display = "block";
            if (hasTmdbId) {
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

    // GÜNCELLEME: "Yorumumu Geliştir" butonu tıklama olayı, Pro kontrolü eklendi.
    enhanceCommentButton.addEventListener("click", async () => {
        if (!isUserPro()) {
            showPaywall();
            return;
        }
        
        const currentComment = movieCommentInput.value.trim();
        if (currentComment.length < 10) {
            showNotification("Lütfen yorumunuzu geliştirmek için en az 10 karakter girin.","error");
            return;
        }
        await enhanceCommentWithGemini(
            currentComment,
            movieTitleInput.value,
            movieCommentInput,
            enhanceCommentButton
        );
    });

    // GÜNCELLEME: "Karakterle Sohbet" butonu tıklama olayı, Pro kontrolü eklendi.
    chatWithCharacterButton.addEventListener('click', () => {
        if (!isUserPro()) {
            showPaywall();
            return;
        }
        handleOpenCharacterSelection();
    });

    isModalInitialized = true;
}

export function openMovieMode(
  movieId = null,
  prefillData = null,
  originList = null
) {
  initializeMovieModal();

  const today = new Date().toISOString().split("T")[0];
  movieDateInput.max = today;

  movieForm.reset();
  setCurrentRating(0);

  tmdbSearchResultsDiv.innerHTML = "";
  tmdbSearchResultsDiv.classList.add("hidden");
  tmdbSearchMessage.style.display = "none";
  movieTitleInput.readOnly = false;
  chatWithCharacterButton.classList.add("hidden");

  const ratingGroup = movieRatingInputDiv.parentElement;

  if (movieId) {
    let movieToEdit;
    let isWatchLater = originList === "watch-later";

    if (isWatchLater) {
      movieToEdit = watchLaterMovies.find((movie) => movie.id === movieId);
    } else {
      movieToEdit = watchedMovies.find((movie) => movie.id === movieId);
    }

    if (movieToEdit) {
      modalTitle.textContent = "Filmi Düzenle";
      movieIdInput.value = movieToEdit.id;
      movieTmdbIdInput.value = movieToEdit.tmdbId || "";
      movieTypeInput.value = originList;
      movieRuntimeInput.value = movieToEdit.runtime || "";
      movieTitleInput.value = movieToEdit.title;
      moviePosterInput.value = movieToEdit.poster;
      movieCommentInput.value = movieToEdit.comment || "";
      movieGenresInput.value = JSON.stringify(movieToEdit.genres || []);
      movieDirectorInput.value = movieToEdit.director || "";
      watchLaterCheckbox.checked = isWatchLater;

      if (isWatchLater) {
        movieDateInput.disabled = true;
        movieDateInput.required = false;
        watchedDateGroup.style.display = "none";
        ratingGroup.style.display = "none";
        enhanceCommentButton.style.display = "none";
        setCurrentRating(0);
        movieRatingInputDiv.innerHTML = "";
      } else {
        movieDateInput.disabled = false;
        movieDateInput.required = true;
        watchedDateGroup.style.display = "block";
        ratingGroup.style.display = "block";
        enhanceCommentButton.style.display = "block";
        movieDateInput.value = movieToEdit.watchedDate || "";
        setCurrentRating(movieToEdit.rating || 0);
        setupStarRating(movieRatingInputDiv, movieToEdit.rating || 0);
      }
    }
  } else {
    modalTitle.textContent = "Film Ekle";
    movieIdInput.value = "";
    movieTypeInput.value = "watched";
    movieDateInput.value = today;
    watchLaterCheckbox.checked = false;
    movieDateInput.disabled = false;
    movieDateInput.required = true;
    watchedDateGroup.style.display = "block";
    ratingGroup.style.display = "block";
    enhanceCommentButton.style.display = "block";
    setupStarRating(movieRatingInputDiv, 0);

    if (prefillData) {
      movieTitleInput.value = prefillData.title || "";
      moviePosterInput.value = prefillData.poster || "";
      movieRuntimeInput.value = prefillData.runtime || "";
      movieGenresInput.value = JSON.stringify(prefillData.genres || []);
      movieDirectorInput.value = prefillData.director || "";
      movieTmdbIdInput.value = prefillData.tmdbId || "";
      if (prefillData.release_date) {
        movieDateInput.value = prefillData.release_date;
      }
      movieTitleInput.readOnly = true;
    }
  }

  const hasTmdbId = !!movieTmdbIdInput.value;
  const isWatchLaterChecked = watchLaterCheckbox.checked;

  if (hasTmdbId && !isWatchLaterChecked) {
    chatWithCharacterButton.classList.remove("hidden");
  } else {
    chatWithCharacterButton.classList.add("hidden");
  }

  // GÜNCELLEME: Modal her açıldığında, içindeki Pro özelliklerin durumunu güncelle.
  updateUIForSubscriptionStatus();

  document.body.classList.add("no-scroll");
  movieModalOverlay.classList.remove("hidden");
  setTimeout(() => movieModalOverlay.classList.add("visible"), 10);
}

export function closeMovieMode() {
    if (movieModalOverlay) {
        movieModalOverlay.classList.remove("visible");
        movieModalOverlay.addEventListener(
            "transitionend",
            () => {
                if (!movieModalOverlay.classList.contains("visible")) {
                    movieModalOverlay.classList.add("hidden");
                }
            },
            { once: true }
        );
        document.body.classList.remove("no-scroll");
    }
}

export async function openMovieDetailsModal(tmdbMovieId, isLayered = false) {
    // ... Bu fonksiyonda değişiklik yok, olduğu gibi kalabilir ...
}

export function closeMovieDetailsModal() {
  // ... Bu fonksiyonda değişiklik yok, olduğu gibi kalabilir ...
}

export async function handleMovieFormSubmit(e) {
  // ... Bu fonksiyonda değişiklik yok, olduğu gibi kalabilir ...
}

// ... Diğer yardımcı fonksiyonlar (createParticle, start/stopSplashScreenEffects) aynı kalabilir ...

// GÜNCELLEME: Animasyonu manuel oynatma ve durdurma mantığı eklendi.
export function showLoadingSpinner(text) {
  const loadingSpinnerOverlay = document.getElementById("loadingSpinnerOverlay");
  if (!loadingSpinnerOverlay) return;

  const displayText = text || "Yükleniyor..."; // Varsayılan metin
  document.getElementById("splash-text").textContent = displayText;

  loadingSpinnerOverlay.classList.remove("hidden");

  // YENİ: Oynatıcıyı bul ve oynat
  const player = loadingSpinnerOverlay.querySelector("dotlottie-player");
  if (player) {
      player.play();
  }

  setTimeout(() => {
    loadingSpinnerOverlay.classList.add("visible");
    startSplashScreenEffects();
  }, 10);
}

export function hideLoadingSpinner() {
  const loadingSpinnerOverlay = document.getElementById(
    "loadingSpinnerOverlay"
  );
  if (!loadingSpinnerOverlay) return;

  // YENİ: Oynatıcıyı bul ve durdur
  const player = loadingSpinnerOverlay.querySelector("dotlottie-player");
  if (player) {
      player.stop();
  }

  loadingSpinnerOverlay.classList.remove("visible");
  stopSplashScreenEffects(); 

  loadingSpinnerOverlay.addEventListener(
    "transitionend",
    () => {
      if (!loadingSpinnerOverlay.classList.contains("visible")) {
        loadingSpinnerOverlay.classList.add("hidden");
      }
    },
    { once: true }
  );
}

function renderMovieModalContent() {
  if (movieModalOverlay.querySelector(".modal-content")) {
    return;
  }

  const modalContent = document.createElement("div");
  modalContent.className = "modal-content";

  modalContent.innerHTML = `
        <div class="modal-header">
          <h2 id="modal-title"></h2>
          <button type="button" class="close-modal-btn">&times;</button>
        </div>
        <form id="movie-form">
          <input type="hidden" id="movie-id" />
          <input type="hidden" id="movie-tmdb-id" />
          <input type="hidden" id="movie-type" />
          <input type="hidden" id="movie-runtime-input" />
          <input type="hidden" id="movie-genres-input" />
          <input type="hidden" id="movie-director-input" />
          <div class="form-group">
            <label for="movie-title-input">Film Adı:</label>
            <input type="text" id="movie-title-input" required placeholder="Film adı yazmaya başlayın..." />
            <div id="tmdb-search-results" class="tmdb-search-results hidden"></div>
            <p id="tmdb-search-message" class="tmdb-search-message" style="display: none"></p>
          </div>
          <input type="hidden" id="movie-poster-input" />
          <div class="form-group">
            <label for="movie-rating-input">Puanınız:</label>
            <div id="movie-rating-input" class="rating-input"></div>
          </div>
          <label class="toggle-switch-container">
            <span class="toggle-switch-label">Daha Sonra İzle</span>
            <div class="toggle-switch-wrapper">
              <input type="checkbox" id="watch-later-checkbox" />
              <span class="toggle-switch-slider"></span>
            </div>
          </label>
          <div class="form-group" id="watched-date-group">
            <label for="movie-date-input">İzleme Tarihi:</label>
            <input type="date" id="movie-date-input" value="" required />
          </div>
          <div class="form-group">
            <label for="movie-comment-input">Yorumunuz:</label>
            <textarea id="movie-comment-input" rows="3" placeholder="Filme dair düşüncelerinizi buraya yazın..."></textarea>
            <div class="form-buttons-group">
              <button type="button" id="enhance-comment-button" class="enhance-comment-button">
                <span class="loading-spinner"></span>
                <span class="button-text">✨ Yorumumu Geliştir</span>
              </button>
              <button type="button" id="chat-with-character-button" class="chat-character-button hidden">
                <span class="loading-spinner"></span>
                <span class="button-text">🎭 Karakterle Sohbet Et</span>
              </button>
            </div>
          </div>
          <div class="modal-actions">
            <button type="button" id="cancel-button" class="cancel-button">İptal</button>
            <button type="submit" id="save-button" class="save-button">Kaydet</button>
          </div>
        </form>
    `;

  movieModalOverlay.appendChild(modalContent);

  modalContent
    .querySelector(".close-modal-btn")
    .addEventListener("click", () => closeMovieMode(movieModalOverlay));
}