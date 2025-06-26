// js/modals.js
import {
  TMDB_IMAGE_BASE_URL_W92,
  TMDB_IMAGE_BASE_URL_W500,
  YOUTUBE_EMBED_URL,
  fetchMovieDetailsFromApi,
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

const movieModalOverlay = document.getElementById("movie-modal-overlay");
const modalTitle = document.getElementById("modal-title");
const movieIdInput = document.getElementById("movie-id");
const movieTmdbIdInput = document.getElementById("movie-tmdb-id");
const movieTypeInput = document.getElementById("movie-type");
const movieTitleInput = document.getElementById("movie-title-input");
const moviePosterInput = document.getElementById("movie-poster-input");
const movieRatingInputDiv = document.getElementById("movie-rating-input");
const watchLaterCheckbox = document.getElementById("watch-later-checkbox");
const watchedDateGroup = document.getElementById("watched-date-group");
const movieDateInput = document.getElementById("movie-date-input");
const movieCommentInput = document.getElementById("movie-comment-input");
const enhanceCommentButton = document.getElementById("enhance-comment-button");
const chatWithCharacterButton = document.getElementById(
  "chat-with-character-button"
);
const tmdbSearchResultsDiv = document.getElementById("tmdb-search-results");
const tmdbSearchMessage = document.getElementById("tmdb-search-message");
const movieRuntimeInput = document.getElementById("movie-runtime-input");
const movieGenresInput = document.getElementById("movie-genres-input");
const movieDirectorInput = document.getElementById("movie-director-input");

const movieDetailsModalOverlay = document.getElementById(
  "movie-details-modal-overlay"
);
const detailModalTitle = document.getElementById("detail-modal-title");
const detailModalBody = document.getElementById("detail-modal-body");
const detailLottieLoader = document.getElementById("detail-lottie-loader");
const detailMoviePoster = document.getElementById("detail-movie-poster");
const detailMovieReleaseDate = document.getElementById(
  "detail-movie-release-date"
);
const detailMovieGenres = document.getElementById("detail-movie-genres");
const detailMovieDirector = document.getElementById("detail-movie-director");
const detailMovieOverview = document.getElementById("detail-movie-overview");
const detailMovieTrailerSection = document.getElementById(
  "detail-movie-trailer-section"
);
const detailMovieTrailerIframe = document.getElementById(
  "detail-movie-trailer-iframe"
);
const detailAddToLogButton = document.getElementById(
  "detail-add-to-log-button"
);

// Görünüm Konteynerları
const suggestionGridView = document.getElementById("suggestion-grid-view");
const singleMovieDetailView = document.getElementById(
  "single-movie-detail-view"
);

export function openMovieMode(
  movieId = null,
  prefillData = null,
  originList = null
) {
  // DÜZELTME 2: Tarih alanını bugünün tarihiyle sınırla
  const today = new Date().toISOString().split("T")[0];
  movieDateInput.max = today;

  document.getElementById("movie-form").reset();
  setCurrentRating(0);

  tmdbSearchResultsDiv.innerHTML = "";
  tmdbSearchResultsDiv.classList.add("hidden");
  tmdbSearchMessage.style.display = "none";
  movieTitleInput.value = "";
  moviePosterInput.value = "";
  movieRuntimeInput.value = "";
  movieGenresInput.value = "";
  movieDirectorInput.value = "";
  movieTmdbIdInput.value = "";
  movieTitleInput.readOnly = false;
  chatWithCharacterButton.classList.add("hidden"); // Sohbet butonunu başlangıçta gizle

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

  // DÜZELTME: Sohbet butonu görünürlük mantığını buraya taşı
  const hasTmdbId = !!movieTmdbIdInput.value;
  const isWatchLaterChecked = watchLaterCheckbox.checked;

  if (hasTmdbId && !isWatchLaterChecked) {
    chatWithCharacterButton.classList.remove("hidden");
  } else {
    chatWithCharacterButton.classList.add("hidden");
  }

  document.body.classList.add("no-scroll");
  movieModalOverlay.classList.remove("hidden"); // Modalı göstermeden önce 'hidden' sınıfını kaldır
  movieModalOverlay.classList.add("visible");
}

export function closeMovieMode(modalOverlay) {
  if (modalOverlay) {
    modalOverlay.classList.remove("visible");
    modalOverlay.classList.add("hidden"); // Modalı gizledikten sonra 'hidden' sınıfını tekrar ekle
    document.body.classList.remove("no-scroll");
  }
}

export async function openMovieDetailsModal(tmdbMovieId) {
  // Görünümleri yönet: Grid'i gizle, tekil detayı göster
  if (suggestionGridView) suggestionGridView.classList.add("hidden");
  if (singleMovieDetailView) singleMovieDetailView.classList.remove("hidden");
  detailModalBody.classList.remove("show-content");
  detailLottieLoader.classList.remove("hidden");
  detailLottieLoader.classList.add("visible");
  document.body.classList.add("no-scroll");
  movieDetailsModalOverlay.classList.remove("hidden");
  setTimeout(() => movieDetailsModalOverlay.classList.add("visible"), 10);
  detailAddToLogButton.disabled = true;

  const timerPromise = new Promise((resolve) => setTimeout(resolve, 1500));
  const apiPromise = fetchMovieDetailsFromApi(tmdbMovieId);

  try {
    const [_, { movieData, directorName, trailerKey }] = await Promise.all([
      timerPromise,
      apiPromise,
    ]);

    detailModalTitle.textContent = movieData.title || "Bilgi Yok";
    detailMoviePoster.src = movieData.poster_path
      ? TMDB_IMAGE_BASE_URL_W500 + movieData.poster_path
      : "https://placehold.co/112x160/2A2A2A/AAAAAA?text=Poster+Yok";
    detailMovieReleaseDate.textContent = movieData.release_date
      ? `Vizyon Tarihi: ${new Date(movieData.release_date).toLocaleDateString(
          "tr-TR",
          { year: "numeric", month: "long", day: "numeric" }
        )}`
      : "Vizyon Tarihi: Bilinmiyor";
    detailMovieGenres.textContent =
      movieData.genres && movieData.genres.length > 0
        ? `Türler: ${movieData.genres.map((g) => g.name).join(", ")}`
        : "Türler: Bilinmiyor";
    detailMovieDirector.textContent = `Yönetmen: ${directorName}`;
    detailMovieOverview.textContent =
      movieData.overview || "Bu film için özet bulunmamaktadır.";

    if (trailerKey) {
      detailMovieTrailerIframe.src = `${YOUTUBE_EMBED_URL}${trailerKey}?autoplay=0&rel=0`;
      detailMovieTrailerSection.classList.remove("hidden");
    } else {
      detailMovieTrailerSection.classList.add("hidden");
    }
    detailAddToLogButton.classList.remove("hidden");

    detailAddToLogButton.disabled = false;
    detailAddToLogButton.onclick = () => {
      closeMovieDetailsModal();
      openMovieMode(null, {
        title: movieData.title,
        tmdbId: movieData.id, // TMDB ID'sini de gönder
        poster: movieData.poster_path
          ? TMDB_IMAGE_BASE_URL_W92 + movieData.poster_path
          : "",
        release_date: movieData.release_date,
        runtime: movieData.runtime,
        genres: movieData.genres,
        director: directorName,
      });
    };
  } catch (error) {
    console.error("Film detayları yüklenirken hata oluştu:", error);
    detailModalTitle.textContent = "Hata Oluştu";
    detailModalBody.innerHTML = `<p class="text-red-400 text-center p-4">Film detayları yüklenirken bir sorun oluştu.</p>`;
  } finally {
    // 3. Yükleyiciyi gizle ve içeriği yumuşak geçişle göster
    detailLottieLoader.classList.add("hidden");
    detailLottieLoader.classList.remove("visible");
    setTimeout(() => {
      detailModalBody.classList.add("show-content");
    }, 50); // Tarayıcının ilk durumu işlemesi için kısa bir gecikme
  }
}

export function closeMovieDetailsModal() {
  document.body.classList.remove("no-scroll");
  movieDetailsModalOverlay.classList.remove("visible");

  // Her iki görünümü de sıfırla
  if (suggestionGridView) suggestionGridView.classList.add("hidden");
  if (singleMovieDetailView) singleMovieDetailView.classList.add("hidden");
  detailMovieTrailerIframe.src = "";
}

document.addEventListener("DOMContentLoaded", () => {
  document
    .getElementById("movie-form")
    .addEventListener("submit", handleMovieFormSubmit);
});

export async function handleMovieFormSubmit(e) {
  e.preventDefault();

  const modal = document.getElementById("movie-modal-overlay");
  closeMovieMode(modal);

  const movieId = movieIdInput.value;
  const tmdbId = movieTmdbIdInput.value;
  const originalType = movieTypeInput.value;
  const title = movieTitleInput.value.trim();
  const poster =
    moviePosterInput.value ||
    `https://placehold.co/70x100/2A2A2A/AAAAAA?text=${encodeURIComponent(
      "Poster Yok"
    )}`;
  const comment = movieCommentInput.value;
  const isWatchLater = watchLaterCheckbox.checked;
  const runtime = parseInt(movieRuntimeInput.value, 10) || 0;
  const director = movieDirectorInput.value || "Bilinmiyor";
  let genres = [];
  try {
    genres = JSON.parse(movieGenresInput.value || "[]");
  } catch (e) {
    console.error("Genres parse error", e);
    genres = [];
  }

  if (title === "") {
    showNotification("Lütfen film adı alanını doldurunuz.", "error");
    return;
  }

  const newId = movieId || Date.now().toString();
  const newType = isWatchLater ? "watch-later" : "watched";
  let movieData;

  if (isWatchLater) {
    movieData = {
      id: newId,
      title,
      poster,
      comment,
      type: newType,
      runtime,
      director,
      genres,
      tmdbId,
    };
  } else {
    if (currentRating === 0 || !movieDateInput.value) {
      showNotification(
        "Lütfen puan ve izleme tarihi alanlarını doldurunuz.",
        "error"
      );
      return;
    }
    movieData = {
      id: newId,
      title,
      poster,
      rating: currentRating,
      watchedDate: movieDateInput.value,
      comment,
      type: newType,
      runtime,
      director,
      genres,
      tmdbId,
    };
  }

  if (movieId && originalType !== newType) {
    await deleteMovieFromList(movieId, originalType);
  }

  await saveMovie(movieData);
  showNotification(`'${title}' başarıyla kaydedildi.`, "success");
  showSection(
    isWatchLater ? "watch-later-movies-section" : "my-watched-movies-section"
  );
}
