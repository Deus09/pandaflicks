// js/modals.js
import { getTranslation, getCurrentLang } from "./i18n.js";
import { onModalOpen, onModalClose } from './scroll-lock.js'; // BU SATIRI EKLEYİN
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
// GÜNCELLEME: user.js'den ilgili fonksiyonları import ediyoruz.
import { isUserPro, updateUIForSubscriptionStatus } from './user.js';
import { showPaywall } from './paywall.js'; // YENİ: import ekle


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

/**
 * Sadece bir kez çalışarak Film Ekle/Düzenle modalının içeriğini oluşturur,
 * referansları atar ve olay dinleyicilerini bağlar.
 */
function initializeMovieModal() {
  if (isModalInitialized) return;

  const overlay = document.getElementById("movie-modal-overlay");
  if (!overlay) return;

  const modalContent = document.createElement("div");
  modalContent.className = "modal-content";
  // DÜZELTME: Butonların HTML'ine pro-feature sınıfı ve pro-badge span'ı doğru şekilde eklendi.
  modalContent.innerHTML = `
      <div class="modal-header"><h2 id="modal-title"></h2></div>
      <form id="movie-form" novalidate>
          <input type="hidden" id="movie-id" /><input type="hidden" id="movie-tmdb-id" /><input type="hidden" id="movie-type" /><input type="hidden" id="movie-runtime-input" /><input type="hidden" id="movie-genres-input" /><input type="hidden" id="movie-director-input" />
          <div class="form-group">
              <label for="movie-title-input">${getTranslation("modal_movie_title_label")}</label>
              <input type="text" id="movie-title-input" required placeholder="${getTranslation("placeholder_movie_title")}" />
              <div id="tmdb-search-results" class="tmdb-search-results hidden"></div>
              <p id="tmdb-search-message" class="tmdb-search-message" style="display: none;"></p>
          </div>
          <input type="hidden" id="movie-poster-input" />
          <div class="form-group"><label for="movie-rating-input">${getTranslation("modal_rating_label")}</label><div id="movie-rating-input" class="rating-input"></div></div>
          <label class="toggle-switch-container"><span class="toggle-switch-label">${getTranslation("modal_watch_later_label")}</span><div class="toggle-switch-wrapper"><input type="checkbox" id="watch-later-checkbox" /><span class="toggle-switch-slider"></span></div></label>
          <div class="form-group" id="watched-date-group"><label for="movie-date-input">${getTranslation("modal_watched_date_label")}</label><input type="date" id="movie-date-input" value="" required /></div>
          <div class="form-group">
              <label for="movie-comment-input">${getTranslation("modal_comment_label")}</label>
              <textarea id="movie-comment-input" rows="3" placeholder="${getTranslation("ai_prompt_modal_placeholder")}"></textarea>
              <div class="form-buttons-group">
                  <button type="button" id="enhance-comment-button" class="enhance-comment-button pro-feature"><span class="loading-spinner"></span><span class="button-text">${getTranslation("modal_enhance_comment_button")}<span class="pro-badge">PRO</span></span></button>
                  <button type="button" id="chat-with-character-button" class="chat-character-button hidden pro-feature"><span class="loading-spinner"></span><span class="button-text">${getTranslation("modal_chat_button")}<span class="pro-badge">PRO</span></span></button>
              </div>
          </div>
          <div class="modal-actions">
              <button type="button" id="cancel-button" class="cancel-button">${getTranslation("modal_cancel_button")}</button>
              <button type="submit" id="save-button" class="save-button">${getTranslation("modal_save_button")}</button>
          </div>
      </form>
  `;
  overlay.appendChild(modalContent);

  // DOM referanslarını atama...
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

  // Olay Dinleyicileri...
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

  // DÜZELTME: "Yorumumu Geliştir" butonu tıklama olayı, Pro kontrolü eklendi.
  enhanceCommentButton.addEventListener("click", async () => {
    if (!isUserPro()) {
      showPaywall(); // GÜNCELLEME: alert yerine paywall göster
      return;
    }

    const currentComment = movieCommentInput.value.trim();
    if (currentComment.length < 10) {
      showNotification(getTranslation('notification_save_validation_fail'), "error");
      return;
    }
    await enhanceCommentWithGemini(
      currentComment,
      movieTitleInput.value,
      movieCommentInput,
      enhanceCommentButton
    );
  });

  // DÜZELTME: "Karakterle Sohbet" butonu tıklama olayı, Pro kontrolü eklendi.
  chatWithCharacterButton.addEventListener('click', () => {
    if (!isUserPro()) {
      showPaywall(); // GÜNCELLEME: alert yerine paywall göster
      return;
    }
    handleOpenCharacterSelection();
  });

  isModalInitialized = true;
}

/**
 * Film Ekle/Düzenle modalını açar ve doldurur.
 */
export function openMovieMode(movieId = null, prefillData = null, originList = null) {
  onModalOpen(); // BU SATIRI EKLEYİN
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
      modalTitle.textContent = getTranslation('modal_edit_title');
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
    modalTitle.textContent = getTranslation('modal_add_title');
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

  // DÜZELTME: Modal her açıldığında, içindeki Pro özelliklerin durumunu güncelle.
  // Bu, dinamik olarak eklenen butonların da kilitlenmesini sağlar.
  updateUIForSubscriptionStatus();

  movieModalOverlay.classList.remove("hidden");
  setTimeout(() => movieModalOverlay.classList.add("visible"), 10);
}

// Geri kalan fonksiyonlarda (closeMovieMode, openMovieDetailsModal vb.) değişiklik yok.
export function closeMovieMode() {
  if (movieModalOverlay) {
    onModalClose(); // BU SATIRI EKLEYİN
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
  }
}

export async function openMovieDetailsModal(tmdbMovieId, isLayered = false) {
  onModalOpen(); // BU SATIRI EKLEYİN
  if (!movieDetailsModalOverlay) {
    movieDetailsModalOverlay = document.getElementById("movie-details-modal-overlay");
    detailModalTitle = document.getElementById("detail-modal-title");
    detailModalBody = document.getElementById("detail-modal-body");
    detailLottieLoader = document.getElementById("detail-lottie-loader");
    detailMoviePoster = document.getElementById("detail-movie-poster");
    detailMovieReleaseDate = document.getElementById("detail-movie-release-date");
    detailMovieGenres = document.getElementById("detail-movie-genres");
    detailMovieDirector = document.getElementById("detail-movie-director");
    detailMovieOverview = document.getElementById("detail-movie-overview");
    detailMovieTrailerSection = document.getElementById("detail-movie-trailer-section");
    detailMovieTrailerIframe = document.getElementById("detail-movie-trailer-iframe");
    detailAddToLogButton = document.getElementById("detail-add-to-log-button");
  }


  if (isLayered) {
    movieDetailsModalOverlay.classList.add('is-layered');
  }

  movieDetailsModalOverlay.classList.remove("hidden");
  setTimeout(() => movieDetailsModalOverlay.classList.add("visible"), 10);

  detailModalBody.style.display = "none";
  detailLottieLoader.style.display = "flex";
  const player = detailLottieLoader.querySelector("dotlottie-player");
  if (player) player.play();

  detailModalTitle.textContent = getTranslation('loading');
  detailAddToLogButton.disabled = true;

  const timerPromise = new Promise((resolve) => setTimeout(resolve, 500));
  const apiPromise = fetchMovieDetailsFromApi(tmdbMovieId);

  try {
    const [_, movieDetails] = await Promise.all([timerPromise, apiPromise]);
    const { movieData, directorName, trailerKey } = movieDetails;

    detailModalTitle.textContent = movieData.title || getTranslation('details_no_info');
    detailMoviePoster.src = movieData.poster_path ? `${TMDB_IMAGE_BASE_URL_W500}${movieData.poster_path}` : "https://placehold.co/112x160/2A2A2A/AAAAAA?text=Poster+Yok";
    detailMovieReleaseDate.textContent = `${getTranslation('details_release_date_prefix')}: ${movieData.release_date ? new Date(movieData.release_date).toLocaleDateString(getCurrentLang() === 'tr' ? 'tr-TR' : 'en-US', { year: "numeric", month: "long", day: "numeric" }) : getTranslation('details_no_info')}`;
    detailMovieGenres.textContent = `${getTranslation('details_genres_prefix')}: ${movieData.genres?.length > 0 ? movieData.genres.map((g) => g.name).join(", ") : getTranslation('details_no_info')}`;
    detailMovieDirector.textContent = `${getTranslation('details_director_prefix')}: ${directorName}`;
    detailMovieOverview.textContent = movieData.overview || getTranslation('details_no_overview');

    const tmdbRatingEl = document.getElementById('detail-tmdb-rating');
    const imdbLinkEl = document.getElementById('detail-imdb-link');
    const ratingsContainer = document.getElementById('detail-ratings-container');

    if (movieData.vote_average) {
      tmdbRatingEl.textContent = movieData.vote_average.toFixed(1);
    } else {
      tmdbRatingEl.textContent = 'N/A';
    }

    if (movieData.imdb_id) {
      imdbLinkEl.href = `https://www.imdb.com/title/${movieData.imdb_id}/`;
      imdbLinkEl.style.display = 'inline-flex';
    } else {
      imdbLinkEl.style.display = 'none';
    }
    ratingsContainer.style.display = 'flex';


    if (trailerKey) {
      detailMovieTrailerIframe.src = `${YOUTUBE_EMBED_URL}${trailerKey}?rel=0`;
      detailMovieTrailerSection.classList.remove("hidden");
    } else {
      detailMovieTrailerIframe.src = '';
      detailMovieTrailerSection.classList.add("hidden");
    }

    const newButton = detailAddToLogButton.cloneNode(true);
    detailAddToLogButton.parentNode.replaceChild(newButton, detailAddToLogButton);
    detailAddToLogButton = newButton;

    detailAddToLogButton.addEventListener("click", () => {
      closeMovieDetailsModal();
      const suggestionModal = document.getElementById('suggestionResultOverlay');
      if (suggestionModal && suggestionModal.classList.contains('visible')) {
        suggestionModal.classList.remove('visible');
      }

      openMovieMode(null, {
        title: movieData.title,
        tmdbId: movieData.id,
        poster: movieData.poster_path ? TMDB_IMAGE_BASE_URL_W92 + movieData.poster_path : "",
        release_date: movieData.release_date,
        runtime: movieData.runtime,
        genres: movieData.genres,
        director: directorName,
      });
    });
    detailAddToLogButton.disabled = false;

  } catch (error) {
    console.error("Film detayları yüklenirken hata oluştu:", error);
    detailModalTitle.textContent = getTranslation('error_occurred_title');
    detailMovieOverview.textContent = getTranslation('details_error_loading').replace('{error}', error.message);
  } finally {
    if (player) player.stop();
    detailLottieLoader.style.display = "none";
    detailModalBody.style.display = "flex";
  }
}

export function closeMovieDetailsModal() {
  if (!movieDetailsModalOverlay) return;
  onModalClose(); // BU SATIRI EKLEYİN
  movieDetailsModalOverlay.classList.remove("visible");
  detailMovieTrailerIframe.src = "";

  movieDetailsModalOverlay.addEventListener('transitionend', () => {
    if (!movieDetailsModalOverlay.classList.contains('visible')) {
      movieDetailsModalOverlay.classList.add('hidden');
      movieDetailsModalOverlay.classList.remove('is-layered');
    }
  }, { once: true });

}

export async function handleMovieFormSubmit(e) {
  e.preventDefault();
  closeMovieMode();

  const movieData = {
    id: movieIdInput.value || Date.now().toString(),
    tmdbId: movieTmdbIdInput.value,
    title: movieTitleInput.value.trim(),
    poster:
      moviePosterInput.value ||
      `https://placehold.co/70x100/2A2A2A/AAAAAA?text=Poster+Yok`,
    comment: movieCommentInput.value,
    type: watchLaterCheckbox.checked ? "watch-later" : "watched",
    runtime: parseInt(movieRuntimeInput.value, 10) || 0,
    director: movieDirectorInput.value || getTranslation('unknown'),
    genres: JSON.parse(movieGenresInput.value || "[]"),
    rating: watchLaterCheckbox.checked ? null : currentRating,
    watchedDate: watchLaterCheckbox.checked ? null : movieDateInput.value,
  };

  if (
    movieData.type === "watched" &&
    (movieData.rating === 0 || !movieData.watchedDate)
  ) {
    showNotification(
      getTranslation('notification_save_validation_fail'),
      "error"
    );
    return;
  }

  if (movieIdInput.value && movieTypeInput.value !== movieData.type) {
    await deleteMovieFromList(movieIdInput.value, movieTypeInput.value);
  }

  await saveMovie(movieData);
  showNotification(getTranslation('notification_movie_saved').replace('{title}', movieData.title), "success");
}

const loadingSpinnerOverlay = document.getElementById("loadingSpinnerOverlay");
const particlesContainer = document.querySelector(".particles-container");
let particleInterval;

const particleImages = [
  "https://image.tmdb.org/t/p/w92/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg",
  "https://image.tmdb.org/t/p/w92/rBF8wVQN8hTwsGPgWbARNIJyEj.jpg",
  "https://image.tmdb.org/t/p/w92/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
  "https://image.tmdb.org/t/p/w92/2u7zbn8EudG6kLlJXPv2DEqv6H.jpg",
  "https://image.tmdb.org/t/p/w92/suaEOtk1N1sgg2MTM7oZd2cfVp3.jpg",
  "https://image.tmdb.org/t/p/w92/8OKmBV5BUFzmozIC3pPWKHy17kx.jpg",
  "https://image.tmdb.org/t/p/w92/d5iIlFn5s0ImszYzrKYOFT0Rdl2.jpg",
  "https://image.tmdb.org/t/p/w92/bX2xnavhMYjWDoZp1VM6VnU1xwe.jpg",
];

function createParticle() {
  if (!particlesContainer) return;
  const particle = document.createElement("div");
  particle.className = "particle";

  const size = Math.random() * 40 + 10;
  const xPos = Math.random() * 100;
  const duration = Math.random() * 10 + 8;
  const delay = Math.random() * 5;
  const image =
    particleImages[Math.floor(Math.random() * particleImages.length)];

  particle.style.width = `${size}px`;
  particle.style.height = `${size}px`;
  particle.style.left = `${xPos}%`;
  particle.style.animationDuration = `${duration}s`;
  particle.style.animationDelay = `${delay}s`;
  particle.style.backgroundImage = `url(${image})`;

  particlesContainer.appendChild(particle);

  setTimeout(() => {
    particle.remove();
  }, (duration + delay) * 1000);
}

export function startSplashScreenEffects() {
  if (particleInterval) clearInterval(particleInterval);
  if (particlesContainer) particlesContainer.innerHTML = "";
  particleInterval = setInterval(createParticle, 200);
}

export function stopSplashScreenEffects() {
  if (particleInterval) clearInterval(particleInterval);
}



export function showLoadingSpinner(text) {
  const loadingSpinnerOverlay = document.getElementById("loadingSpinnerOverlay");
  if (!loadingSpinnerOverlay) return;

  // EKLENECEK: Yükleme ekranı içindeki lottie oynatıcısını buluyoruz.
  const player = loadingSpinnerOverlay.querySelector("dotlottie-player");

  const displayText = text || loadingTexts[Math.floor(Math.random() * loadingTexts.length)];
  document.getElementById("splash-text").textContent = displayText;

  loadingSpinnerOverlay.classList.remove("hidden");
  setTimeout(() => {
    loadingSpinnerOverlay.classList.add("visible");
    startSplashScreenEffects();
    // EKLENECEK: Eğer oynatıcı bulunduysa, play() komutuyla animasyonu başlatıyoruz.
    if (player) {
      player.play();
    }
  }, 10);
}

export function hideLoadingSpinner() {
  const loadingSpinnerOverlay = document.getElementById(
    "loadingSpinnerOverlay"
  );
  if (!loadingSpinnerOverlay) return;

  // EKLENECEK: Durdurmak için lottie oynatıcısını tekrar buluyoruz.
  const player = loadingSpinnerOverlay.querySelector("dotlottie-player");
  // EKLENECEK: Eğer oynatıcı bulunduysa, stop() komutuyla animasyonu durduruyoruz.
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