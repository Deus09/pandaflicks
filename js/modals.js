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

  // DÜZELTME: Modal her açıldığında, içindeki Pro özelliklerin durumunu güncelle.
  // Bu, dinamik olarak eklenen butonların da kilitlenmesini sağlar.
  updateUIForSubscriptionStatus();

  movieModalOverlay.classList.remove("hidden");
  setTimeout(() => movieModalOverlay.classList.add("visible"), 10);
}

// Geri kalan fonksiyonlarda (closeMovieMode, openMovieDetailsModal vb.) değişiklik yok.
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
    }
}

export async function openMovieDetailsModal(tmdbMovieId, isLayered = false) {
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

    detailModalTitle.textContent = "Yükleniyor...";
    detailAddToLogButton.disabled = true;

    const timerPromise = new Promise((resolve) => setTimeout(resolve, 500));
    const apiPromise = fetchMovieDetailsFromApi(tmdbMovieId);

    try {
        const [_, movieDetails] = await Promise.all([timerPromise, apiPromise]);
        const { movieData, directorName, trailerKey } = movieDetails;
        
        detailModalTitle.textContent = movieData.title || "Bilgi Yok";
        detailMoviePoster.src = movieData.poster_path ? `${TMDB_IMAGE_BASE_URL_W500}${movieData.poster_path}` : "https://placehold.co/112x160/2A2A2A/AAAAAA?text=Poster+Yok";
        detailMovieReleaseDate.textContent = movieData.release_date ? `Vizyon Tarihi: ${new Date(movieData.release_date).toLocaleDateString("tr-TR",{ year: "numeric", month: "long", day: "numeric" })}` : "Vizyon Tarihi: Bilinmiyor";
        detailMovieGenres.textContent = movieData.genres?.length > 0 ? `Türler: ${movieData.genres.map((g) => g.name).join(", ")}` : "Türler: Bilinmiyor";
        detailMovieDirector.textContent = `Yönetmen: ${directorName}`;
        detailMovieOverview.textContent = movieData.overview || "Bu film için özet bulunmamaktadır.";

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
            if(suggestionModal && suggestionModal.classList.contains('visible')) {
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
        detailModalTitle.textContent = "Hata Oluştu";
        detailMovieOverview.textContent = `Film detayları yüklenirken bir sorun oluştu: ${error.message}`;
    } finally {
        if (player) player.stop();
        detailLottieLoader.style.display = "none";
        detailModalBody.style.display = "flex";
    }
}

export function closeMovieDetailsModal() {
  if (!movieDetailsModalOverlay) return;

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

const loadingTexts = [
    // Klasikler
    "Film evreni taranıyor...",
    "Mısırlar hazırlanıyor...",
    "En iyi koltuk seçiliyor...",
    "Yönetmenin kamerasından bakılıyor...",
    "Kırmızı halı seriliyor...",
    "Jenerik müziği besteleniyor...",
    "Post-prodüksiyon efektleri ekleniyor...",

    // Karakter Göndermeleri
    "Yoda ile Güç üzerine meditasyon yapılıyor...",
    "Terminator 'I'll be back' dedi, bekleniyor...",
    "Sherlock Holmes ipuçlarını birleştiriyor...",
    "Vito Corleone'den reddedilemeyecek bir teklif alınıyor...",
    "Neo'ya hangi hapı seçeceği soruluyor: Komedi mi, Dram mı?",
    "Gandalf 'Geçemezsin!' dedi, en iyi filmler geçiyor...",
    "Kaptan Jack Sparrow'un pusulası en iyi filmi arıyor...",
    "Forrest Gump'ın çikolata kutusundan bir film seçiliyor...",
    "John Wick'in köpeği için en iyi animasyon bulunuyor...",
    "James Bond martini'sini hazırlıyor: 'Çalkalanmış, karıştırılmamış.'",
    "Örümcek Adam ağlarını en iyi filme doğru fırlatıyor...",
    "Hogwarts'ta en iyi film için Quidditch maçı düzenleniyor...",
    "Indiana Jones, en iyi macera filmini bulmak için antik haritaları inceliyor...",
    "Darth Vader, 'Benimle gel, en iyi filmi bulalım.' diyor...",
    "Hulk, 'En iyi filmi bulmak için sinemaya gideceğim!' diyor...",
    "Tony Stark, 'En iyi filmi bulmak için Arc Reactor'ı kullanacağım.' diyor...",
    "Katniss Everdeen, 'En iyi filmi bulmak için ok ve yayımı kullanacağım.' diyor...",
    "Jack Dawson, 'En iyi filmi bulmak için Titanic'i terk edeceğim.' diyor...",
    "Yüzüklerin Efendisi'nde Frodo, 'En iyi filmi bulmak için Yüzük'ü yok edeceğim.' diyor...",
    "Batman, Gotham'da en iyi filmi bulmak için Batmobil'ini kullanıyor...",


    // Yapay Zeka Esprileri
    "Algoritmalar kahve molasında...",
    "1'ler ve 0'lar arasında mükemmel eşleşme aranıyor...",
    "Nöral ağlar arasında sinapslar ateşleniyor...",
    "Terabaytlarca film verisi eleniyor...",
    "Öneri motoru ısınıyor...",


     
    // Meşhur Replikler
    "Houston, bir önerimiz var...",
    "Görevimiz: Mükemmel Filmi Bulmak.",
    "Büyük güç, büyük film önerileri getirir.",
     "Batman sinemaya gizlice girdi, yakalanmadan ilerleniyor...",
    "Thanos eldivenini taktı... spoiler vermemeye çalışıyoruz!",
    "Hızlı ve Öfkeli kadrosu park yeri arıyor...",
    "Harry Potter büyüyü yanlış yaptı, sahne başa sarıldı...",
    "Joker’in kahkahası susturulmaya çalışılıyor...",
    "Yüzük Frodo’ya geri gönderiliyor… kargo yolda.",
    "Obi-Wan ışın kılıcını şarj ediyor… lütfen bekleyin.",
    "Deadpool replik yazıyor… sansürlemeye çalışıyoruz!",
    "Iron Man zırhını giyiyor… biraz zaman alabilir.",
    "Godzilla seti dağıttı… tekrar kuruluyor.",
    "Neo kırmızı hapı aldı… sistem çökmeden yükleniyor.",
    "Wolverine tıraşa gitti… pençeleri keskinleşiyor.",
    "Gollum ‘kıymetlimisss’i kaybetti… yardım ediyoruz.",
    "Jack Sparrow pusulasını yine yanlış tuttu… rotayı düzeltiyoruz.",
    "Hulk sinirlendi… ama kontrol altında.",
    "Darth Vader nefes alıyor… biraz gürültülü olabilir.",
    "Lego parçaları birleştiriliyor… biri eksik, ayağınıza dikkat!",
    "Sherlock Holmes ipuçlarını topluyor… biraz sabır.",
    "Shrek bataklığını temizliyor… kokular geçici.",
    "James Bond son anda kıyafetini ütülüyor...",
    "Spiderman ağ atıyor ama Wi-Fi zayıf...",
    "Gizemli kutu açılıyor… Jumanji mi bu?",
    "Transformers dönüşümünü tamamlıyor… %76 tamamlandı.",
    "The Rock kaşını kaldırdı… ne olacağı belirsiz.",
    "Yapay zeka Skynet’e bağlanmadan önce hız testi yapıyor...",
    "R2-D2 güncelleniyor… bip bip bip bip bip!",
    "Indiana Jones kayıp sahneyi arıyor… yine yılan var.",
    "Dracula geceyi bekliyor… güneş ışığında yükleme yavaş.",
    "Matrix yeniden başlatılıyor… Deja vu hissediyorsanız normal.",
    "Avengers toplanıyor… Hawkeye nerede yine?",
    "Kung Fu Panda meditasyon yapıyor… birazdan başlıyoruz.",
    "Buzz Lightyear sonsuzluğa yol alıyor… ve ötesine!",
    "Jedi Konseyi toplanıyor… çaylar yeni geldi.",
    "Minyonlar yüklemeyi sabote etti… düzeltmeye çalışıyoruz.",
    "Freddy Krueger uykudan uyandı… birazdan uyanacaksınız.",
    "Sauron’un gözü sizi izliyor… yükleme tamamlanmak üzere."

];

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