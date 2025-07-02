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

// --- MODAL ELEMENT REFERANSLARI ---
// Bu değişkenler, ilgili modal ilk kez açıldığında doldurulacak.
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

let isModalInitialized = false; // Modal'ın bir kez ayarlandığını takip eden bayrak

/**
 * Sadece bir kez çalışarak Film Ekle/Düzenle modalının içeriğini oluşturur,
 * referansları atar ve olay dinleyicilerini bağlar.
 */
function initializeMovieModal() {
    if (isModalInitialized) return; // Zaten kurulduysa tekrar yapma.

    // 1. HTML İÇERİĞİNİ OLUŞTURMA (Bu kısım doğruydu)
    const overlay = document.getElementById("movie-modal-overlay");
    if (!overlay) return;

    const modalContent = document.createElement("div");
    modalContent.className = "modal-content";
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
                    <button type="button" id="enhance-comment-button" class="enhance-comment-button"><span class="loading-spinner"></span><span class="button-text">✨ Yorumumu Geliştir</span></button>
                    <button type="button" id="chat-with-character-button" class="chat-character-button hidden"><span class="loading-spinner"></span><span class="button-text">🎭 Karakterle Sohbet Et</span></button>
                </div>
            </div>
            <div class="modal-actions">
                <button type="button" id="cancel-button" class="cancel-button">İptal</button>
                <button type="submit" id="save-button" class="save-button">Kaydet</button>
            </div>
        </form>
    `;
    overlay.appendChild(modalContent);

    // 2. DOM REFERANSLARINI ATAMA (Bu kısım da doğruydu)
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

    // --- 3. OLAY DİNLEYİCİLERİNİ EKSİKSİZ BİR ŞEKİLDE BAĞLAMA ---
    
    // Ana form ve kapatma butonları
    movieForm.addEventListener("submit", handleMovieFormSubmit);
    document.getElementById("cancel-button").addEventListener("click", () => closeMovieMode());
    movieModalOverlay.addEventListener("click", (e) => {
        if (e.target === movieModalOverlay) closeMovieMode();
    });

    // --- BURASI EKSİK OLAN KOD BLOKLARIYDI ---
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

    enhanceCommentButton.addEventListener("click", async () => {
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
    // --- EKSİK KODLARIN SONU ---

    isModalInitialized = true; // Kurulumun tamamlandığını işaretle
}

/**
 * Film Ekle/Düzenle modalını açar ve doldurur.
 */
export function openMovieMode(
  movieId = null,
  prefillData = null,
  originList = null
) {
  // Modalın içeriğini ve olay dinleyicilerini sadece ilk açılışta oluştur.
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

function populateMovieDetails(movieData, directorName, trailerKey) {
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
    movieData.genres?.length > 0
      ? `Türler: ${movieData.genres.map((g) => g.name).join(", ")}`
      : "Türler: Bilinmiyor";
  detailMovieDirector.textContent = `Yönetmen: ${directorName}`;
  detailMovieOverview.textContent =
    movieData.overview || "Bu film için özet bulunmamaktadır.";

  if (trailerKey) {
    detailMovieTrailerIframe.src = `${YOUTUBE_EMBED_URL}${trailerKey}?rel=0`;
    detailMovieTrailerSection.classList.remove("hidden");
  } else {
    detailMovieTrailerSection.classList.add("hidden");
  }

  // --- Event Listener'ı Güvenli Bir Şekilde Ekleme ---

  // 1. Önceki event listener'lardan kurtulmak için butonu klonla ve eskisini değiştir.
  const newButton = detailAddToLogButton.cloneNode(true);
  detailAddToLogButton.parentNode.replaceChild(newButton, detailAddToLogButton);
  detailAddToLogButton = newButton; // Referansı güncelle

  // 2. Yeni butona olay dinleyicisini ekle.
  detailAddToLogButton.addEventListener("click", () => {
    closeMovieDetailsModal();
    openMovieMode(null, {
      title: movieData.title,
      tmdbId: movieData.id,
      poster: movieData.poster_path
        ? TMDB_IMAGE_BASE_URL_W92 + movieData.poster_path
        : "",
      release_date: movieData.release_date,
      runtime: movieData.runtime,
      genres: movieData.genres,
      director: directorName,
    });
  });

  detailAddToLogButton.disabled = false;
}

// openMovieDetailsModal fonksiyonunun YENİ ve İYİLEŞTİRİLMİŞ HALİ
export async function openMovieDetailsModal(tmdbMovieId) {
  movieDetailsModalOverlay.classList.remove("hidden");
  setTimeout(() => movieDetailsModalOverlay.classList.add("visible"), 10);
  document.body.classList.add("no-scroll");

  detailModalBody.style.display = "none";
  detailLottieLoader.style.display = "flex";
  const player = detailLottieLoader.querySelector("dotlottie-player");
  if (player) player.play(); // Animasyonu başlat

  detailModalTitle.textContent = "Yükleniyor...";
  detailAddToLogButton.disabled = true;

  const timerPromise = new Promise((resolve) => setTimeout(resolve, 1500));
  const apiPromise = fetchMovieDetailsFromApi(tmdbMovieId);

  try {
    const [_, movieDetails] = await Promise.all([timerPromise, apiPromise]);
    populateMovieDetails(
      movieDetails.movieData,
      movieDetails.directorName,
      movieDetails.trailerKey
    );
  } catch (error) {
    console.error("Film detayları yüklenirken hata oluştu:", error);
    detailModalTitle.textContent = "Hata Oluştu";
    // GÜVENLİK: innerHTML yerine textContent kullanılıyor.
    detailMovieOverview.textContent = `Film detayları yüklenirken bir sorun oluştu: ${error.message}`;
  } finally {
    if (player) player.stop(); // Animasyonu durdur
    detailLottieLoader.style.display = "none";
    detailModalBody.style.display = "flex";
  }
}

export function closeMovieDetailsModal() {
  document.body.classList.remove("no-scroll");
  movieDetailsModalOverlay.classList.remove("visible");
  detailMovieTrailerIframe.src = "";
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
    director: movieDirectorInput.value || "Bilinmiyor",
    genres: JSON.parse(movieGenresInput.value || "[]"),
    rating: watchLaterCheckbox.checked ? null : currentRating,
    watchedDate: watchLaterCheckbox.checked ? null : movieDateInput.value,
  };

  if (
    movieData.type === "watched" &&
    (movieData.rating === 0 || !movieData.watchedDate)
  ) {
    showNotification(
      "Lütfen puan ve izleme tarihi alanlarını doldurunuz.",
      "error"
    );
    return;
  }

  if (movieIdInput.value && movieTypeInput.value !== movieData.type) {
    await deleteMovieFromList(movieIdInput.value, movieTypeInput.value);
  }

  await saveMovie(movieData);
  showNotification(`'${movieData.title}' başarıyla kaydedildi.`, "success");
}

// modals.js dosyasının en altına veya uygun bir yere ekleyin

const loadingSpinnerOverlay = document.getElementById("loadingSpinnerOverlay");
const particlesContainer = document.querySelector(".particles-container");
let particleInterval;

// Film önerisi modalı için kullanılan filmlerden rastgele posterler alır
// Bu listeyi projenize uygun şekilde daha dinamik hale getirebilirsiniz.
const particleImages = [
  "https://image.tmdb.org/t/p/w92/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg", // The Shawshank Redemption
  "https://image.tmdb.org/t/p/w92/rBF8wVQN8hTwsGPgWbARNIJyEj.jpg", // The Godfather
  "https://image.tmdb.org/t/p/w92/qJ2tW6WMUDux911r6m7haRef0WH.jpg", // The Dark Knight
  "https://image.tmdb.org/t/p/w92/2u7zbn8EudG6kLlJXPv2DEqv6H.jpg", // Pulp Fiction
  "https://image.tmdb.org/t/p/w92/suaEOtk1N1sgg2MTM7oZd2cfVp3.jpg", // Forrest Gump
  "https://image.tmdb.org/t/p/w92/8OKmBV5BUFzmozIC3pPWKHy17kx.jpg", // The Matrix
  "https://image.tmdb.org/t/p/w92/d5iIlFn5s0ImszYzrKYOFT0Rdl2.jpg", // Inception
  "https://image.tmdb.org/t/p/w92/bX2xnavhMYjWDoZp1VM6VnU1xwe.jpg", // Interstellar
];

function createParticle() {
  if (!particlesContainer) return;
  const particle = document.createElement("div");
  particle.className = "particle";

  // Rastgele boyut, konum, süre ve gecikme
  const size = Math.random() * 40 + 10; // 10px - 50px arası
  const xPos = Math.random() * 100; // 0% - 100% arası
  const duration = Math.random() * 10 + 8; // 8s - 18s arası
  const delay = Math.random() * 5; // 0s - 5s arası
  const image =
    particleImages[Math.floor(Math.random() * particleImages.length)];

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
  if (particlesContainer) particlesContainer.innerHTML = ""; // Eskileri temizle
  // Her 200ms'de bir yeni parçacık oluştur
  particleInterval = setInterval(createParticle, 200);
}

// Splash ekranı gizlendiğinde parçacık üretimini durdur
export function stopSplashScreenEffects() {
  if (particleInterval) clearInterval(particleInterval);
}

export function showLoadingSpinner(text = "Film aranıyor...") {
  const loadingSpinnerOverlay = document.getElementById(
    "loadingSpinnerOverlay"
  );
  if (!loadingSpinnerOverlay) return;

  // 1. Önce 'hidden' sınıfını kaldırarak elemanı DOM'da "var" et
  loadingSpinnerOverlay.classList.remove("hidden");
  document.getElementById("splash-text").textContent = text;

  // 2. Çok küçük bir gecikmeyle 'visible' sınıfını ekleyerek CSS animasyonlarını tetikle
  setTimeout(() => {
    loadingSpinnerOverlay.classList.add("visible");
    startSplashScreenEffects(); // Parçacık efektlerini başlat
  }, 10); // 10 milisaniyelik gecikme, tarayıcının değişikliği algılaması için yeterlidir
}

export function hideLoadingSpinner() {
  const loadingSpinnerOverlay = document.getElementById(
    "loadingSpinnerOverlay"
  );
  if (!loadingSpinnerOverlay) return;

  // 1. Önce 'visible' sınıfını kaldırarak kapanma animasyonunu başlat
  loadingSpinnerOverlay.classList.remove("visible");
  stopSplashScreenEffects(); // Parçacık efektlerini durdur

  // 2. CSS geçişi (transition) bittiğinde elemanı 'hidden' yaparak DOM'dan kaldır
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

// YENİ: Film Ekle/Düzenle modalının içeriğini dinamik olarak oluşturan fonksiyon
function renderMovieModalContent() {
  // Eğer modalın içi zaten doluysa tekrar oluşturma
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

  // ÖNEMLİ: Elementler DOM'a eklendikten sonra olay dinleyicilerini yeniden bağla.
  // Bu, `events.js` dosyasındaki setupEventListeners'ı çağırmak yerine,
  // spesifik olarak bu modal'ın olaylarını burada bağlamak daha iyi bir pratiktir.
  modalContent
    .querySelector(".close-modal-btn")
    .addEventListener("click", () => closeMovieMode(movieModalOverlay));
}
