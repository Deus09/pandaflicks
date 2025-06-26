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
const chatWithCharacterButton = document.getElementById("chat-with-character-button");
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
  chatWithCharacterButton.classList.add('hidden'); // Sohbet butonunu başlangıçta gizle

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
      chatWithCharacterButton.classList.remove('hidden');
  } else {
      chatWithCharacterButton.classList.add('hidden');
  }


  document.body.classList.add("no-scroll");
  movieModalOverlay.classList.add("visible");
}

export function closeMovieMode(modalOverlay) {
  if (modalOverlay) {
    modalOverlay.classList.remove("visible");
    document.body.classList.remove("no-scroll");
  }
}

export async function openMovieDetailsModal(tmdbMovieId) {
  detailLottieLoader.style.display = "flex";
  detailModalBody.style.display = "none";
  document.body.classList.add("no-scroll");
  movieDetailsModalOverlay.classList.add("visible");
  detailModalTitle.textContent = "Yükleniyor...";
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
      ? `Vizyon Tarihi: ${new Date(movieData.release_date).toLocaleDateString("tr-TR",{ year: "numeric", month: "long", day: "numeric" })}`
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
    detailMovieOverview.innerHTML = `<p class="text-red-400">Film detayları yüklenirken bir sorun oluştu.</p>`;
  } finally {
    detailLottieLoader.style.display = "none";
    detailModalBody.style.display = "flex";
  }
}

export function closeMovieDetailsModal() {
  document.body.classList.remove("no-scroll");
  movieDetailsModalOverlay.classList.remove("visible");
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
  } catch(e) {
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
      id: newId, title, poster, comment, type: newType, 
      runtime, director, genres, tmdbId
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
      id: newId, title, poster, rating: currentRating,
      watchedDate: movieDateInput.value, comment,
      type: newType, runtime, director, genres, tmdbId
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

// modals.js dosyasının en altına veya uygun bir yere ekleyin

const loadingSpinnerOverlay = document.getElementById('loadingSpinnerOverlay');
const particlesContainer = document.querySelector('.particles-container');
let particleInterval;

// Film önerisi modalı için kullanılan filmlerden rastgele posterler alır
// Bu listeyi projenize uygun şekilde daha dinamik hale getirebilirsiniz.
const particleImages = [
    'https://image.tmdb.org/t/p/w92/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg', // The Shawshank Redemption
    'https://image.tmdb.org/t/p/w92/rBF8wVQN8hTwsGPgWbARNIJyEj.jpg',  // The Godfather
    'https://image.tmdb.org/t/p/w92/qJ2tW6WMUDux911r6m7haRef0WH.jpg', // The Dark Knight
    'https://image.tmdb.org/t/p/w92/2u7zbn8EudG6kLlJXPv2DEqv6H.jpg',  // Pulp Fiction
    'https://image.tmdb.org/t/p/w92/suaEOtk1N1sgg2MTM7oZd2cfVp3.jpg', // Forrest Gump
    'https://image.tmdb.org/t/p/w92/8OKmBV5BUFzmozIC3pPWKHy17kx.jpg', // The Matrix
    'https://image.tmdb.org/t/p/w92/d5iIlFn5s0ImszYzrKYOFT0Rdl2.jpg', // Inception
    'https://image.tmdb.org/t/p/w92/bX2xnavhMYjWDoZp1VM6VnU1xwe.jpg'  // Interstellar
];

function createParticle() {
    if (!particlesContainer) return;
    const particle = document.createElement('div');
    particle.className = 'particle';
    
    // Rastgele boyut, konum, süre ve gecikme
    const size = Math.random() * 40 + 10; // 10px - 50px arası
    const xPos = Math.random() * 100; // 0% - 100% arası
    const duration = Math.random() * 10 + 8; // 8s - 18s arası
    const delay = Math.random() * 5; // 0s - 5s arası
    const image = particleImages[Math.floor(Math.random() * particleImages.length)];

    particle.style.width = `${size}px`;
    particle.style.height = `${size}px`;
    particle.style.left = `${xPos}%`;
    particle.style.animationDuration = `${duration}s`;
    particle.style.animationDelay = `${delay}s`;
    particle.style.backgroundImage = `url(${image})`;
    
    particlesContainer.appendChild(particle);

    // Animasyon bitince parçacığı DOM'dan kaldır
    setTimeout(() => {
        particle.remove();
    }, (duration + delay) * 1000);
}

// Splash ekranı gösterildiğinde parçacık üretimini başlat
export function startSplashScreenEffects() {
    if (particleInterval) clearInterval(particleInterval);
    if(particlesContainer) particlesContainer.innerHTML = ''; // Eskileri temizle
    // Her 200ms'de bir yeni parçacık oluştur
    particleInterval = setInterval(createParticle, 200);
}

// Splash ekranı gizlendiğinde parçacık üretimini durdur
export function stopSplashScreenEffects() {
    if (particleInterval) clearInterval(particleInterval);
}