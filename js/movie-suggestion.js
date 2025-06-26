// js/movie-suggestion.js
import { openMovieDetailsModal } from "./modals.js";
import { fetchSuggestedMovie } from "./api.js";

// DOM Elementleri
let suggestMovieBtn;
let promptModalOverlay;
let closePromptModalBtn;
let moviePromptInput;
let submitPromptBtn;
let promptError;
let loadingSpinnerOverlay;

/**
 * Film öneri özelliğini başlatır ve olay dinleyicilerini ayarlar.
 */
export function initMovieSuggestion() {
  suggestMovieBtn = document.getElementById("suggestMovieBtn");
  promptModalOverlay = document.getElementById("promptModalOverlay");
  closePromptModalBtn = document.getElementById("closePromptModalBtn");
  moviePromptInput = document.getElementById("moviePromptInput");
  submitPromptBtn = document.getElementById("submitPromptBtn");
  promptError = document.getElementById("promptError");
  loadingSpinnerOverlay = document.getElementById("loadingSpinnerOverlay");

  if (!suggestMovieBtn || !promptModalOverlay) {
    console.error("Film öneri modalı DOM elementleri bulunamadı.");
    return;
  }

  // Olay Dinleyicileri
  suggestMovieBtn.addEventListener("click", openPromptModal);
  closePromptModalBtn.addEventListener("click", closePromptModal);
  promptModalOverlay.addEventListener("click", (e) => {
    if (e.target === promptModalOverlay) {
      closePromptModal();
    }
  });
  submitPromptBtn.addEventListener("click", handleSubmitPrompt);
}

/**
 * Prompt modalını açar.
 */
function openPromptModal() {
  moviePromptInput.value = ""; // Önceki prompt'u temizle
  promptError.textContent = ""; // Hata mesajını temizle
  promptError.classList.add("hidden"); // Hata mesajını gizle
  promptModalOverlay.classList.remove("hidden");
  document.body.classList.add("no-scroll");
  setTimeout(() => promptModalOverlay.classList.add("visible"), 10);
}

/**
 * Prompt modalını kapatır.
 */
function closePromptModal() {
  promptModalOverlay.classList.remove("visible");
  document.body.classList.remove("no-scroll");
  promptModalOverlay.addEventListener(
    "transitionend",
    () => {
      if (!promptModalOverlay.classList.contains("visible")) {
        promptModalOverlay.classList.add("hidden");
      }
    },
    { once: true }
  );
}

/**
 * Yükleniyor spinner'ını gösterir.
 */
function showLoadingSpinner() {
  loadingSpinnerOverlay.classList.remove("hidden");
  document.body.classList.add("no-scroll");
  setTimeout(() => loadingSpinnerOverlay.classList.add("visible"), 10);
}

/**
 * Yükleniyor spinner'ını gizler.
 */
function hideLoadingSpinner() {
  return new Promise((resolve) => {
    if (!loadingSpinnerOverlay.classList.contains("visible")) {
      loadingSpinnerOverlay.classList.add("hidden");
      return resolve();
    }
    const onTransitionEnd = () => {
      loadingSpinnerOverlay.removeEventListener(
        "transitionend",
        onTransitionEnd
      );
      loadingSpinnerOverlay.classList.add("hidden");
      resolve();
    };

    loadingSpinnerOverlay.addEventListener("transitionend", onTransitionEnd);
    loadingSpinnerOverlay.classList.remove("visible");
    document.body.classList.remove("no-scroll");

    // Fallback: transitionend olayı tetiklenmezse diye bir zamanlayıcı
    setTimeout(() => {
      onTransitionEnd();
    }, 350); // CSS geçiş süresinden biraz daha uzun
  });
}

/**
 * Önerilen filmleri 2x2 bir grid'de gösterir.
 * @param {Array} movies - Önerilen film nesnelerinin dizisi.
 */
function displaySuggestedMoviesGrid(movies) {
  const detailModal = document.getElementById("movie-details-modal-overlay");
  const modalBody = document.getElementById("detail-modal-body");
  const modalTitle = detailModal.querySelector("h2");
  const lottieLoader = document.getElementById("detail-lottie-loader");
  const addToLogButton = document.getElementById("detail-add-to-log-button");
  const trailerSection = document.getElementById(
    "detail-movie-trailer-section"
  );

  // Modalı grid görünümü için hazırla
  if (modalTitle) {
    modalTitle.textContent = "Sana Özel Film Önerileri";
  }
  lottieLoader.classList.add("hidden");
  lottieLoader.classList.remove("visible");
  modalBody.innerHTML = ""; // Önceki içeriği temizle
  modalBody.classList.remove("show-content"); // Animasyon için başlangıç durumu
  modalBody.classList.remove("hidden", "flex-col", "gap-4"); // Detay görünümü sınıflarını kaldır

  // Olası tekil film detaylarını gizle
  if (addToLogButton) addToLogButton.classList.add("hidden");
  if (trailerSection) trailerSection.classList.add("hidden");

  // Grid konteynerını oluştur
  const gridContainer = document.createElement("div");
  gridContainer.className = "suggestion-grid"; // Yeni CSS sınıfı
  modalBody.appendChild(gridContainer);

  // Grid'i filmlerle doldur (en fazla 4)
  movies.slice(0, 4).forEach((movie) => {
    const movieElement = document.createElement("div");
    movieElement.className = "suggestion-grid-item";
    movieElement.addEventListener("click", () => {
      // Postere tıklandığında, bu modalın içeriğini film detayıyla güncelle
      openMovieDetailsModal(movie.id);
    });

    const posterWrapper = document.createElement("div");
    posterWrapper.className = "suggestion-poster-wrapper";

    const poster = document.createElement("img");
    poster.src = movie.poster_path
      ? `https://image.tmdb.org/t/p/w342${movie.poster_path}`
      : "https://placehold.co/342x513/2A2A2A/AAAAAA?text=Poster+Yok";
    poster.alt = movie.title;
    poster.className = "suggestion-poster";
    poster.onerror = function () {
      this.onerror = null;
      this.src = "https://placehold.co/342x513/2A2A2A/AAAAAA?text=Poster+Yok";
    };

    posterWrapper.appendChild(poster);

    const detailsContainer = document.createElement("div");
    detailsContainer.className = "suggestion-details";

    const title = document.createElement("p");
    title.className = "suggestion-title";
    title.textContent = movie.title;
    detailsContainer.appendChild(title);

    // Puanı ekle
    if (movie.vote_average && movie.vote_average > 0) {
      const ratingElement = document.createElement("span");
      ratingElement.className = "suggestion-rating";
      ratingElement.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" class="icon-star"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg> <span>${movie.vote_average.toFixed(
        1
      )}</span>`;
      detailsContainer.appendChild(ratingElement);
    }

    // Yönetmeni ekle (Not: 'movie' objesinin 'director' alanını içerdiği varsayılmıştır)
    if (movie.director) {
      const directorElement = document.createElement("p");
      directorElement.className = "suggestion-director";
      directorElement.textContent = `Yön: ${movie.director}`;
      detailsContainer.appendChild(directorElement);
    }

    movieElement.appendChild(posterWrapper);
    movieElement.appendChild(detailsContainer);
    gridContainer.appendChild(movieElement);
  });

  // Modalı göster
  detailModal.classList.remove("hidden");
  document.body.classList.add("no-scroll");
  setTimeout(() => {
    detailModal.classList.add("visible");
    modalBody.classList.add("show-content"); // Grid içeriğini de yumuşak geçişle göster
  }, 50);
}

/**
 * Kullanıcının prompt'unu gönderir ve film önerisi alır.
 */
async function handleSubmitPrompt() {
  const promptText = moviePromptInput.value.trim();
  if (!promptText) {
    promptError.textContent = "Lütfen bir film öneri isteği girin.";
    promptError.classList.remove("hidden");
    return;
  }

  promptError.classList.add("hidden");
  closePromptModal();
  showLoadingSpinner();

  try {
    console.log("handleSubmitPrompt: Film önerisi isteği gönderiliyor...", {
      promptText,
    });
    // API çağrısı için bir zaman aşımı (timeout) ekle    const fetchPromise = fetchSuggestedMovie(promptText);
    const timeoutPromise = new Promise(
      (_, reject) =>
        setTimeout(
          () => reject(new Error("Film önerisi alma süresi aşıldı.")),
          20000
        ) // 20 saniye timeout
    );

    // fetchPromise veya timeoutPromise'dan hangisi önce biterse onu al
    let rawMoviesData = await Promise.race([fetchPromise, timeoutPromise]);
    console.log("handleSubmitPrompt: API'den gelen ham veri:", rawMoviesData);
    console.log("handleSubmitPrompt: API'den gelen ham veri:", rawMoviesData);

    // Gelen verinin bir dizi olduğundan ve geçerli film nesneleri içerdiğinden emin ol
    let movies = [];
    if (rawMoviesData) {
      if (Array.isArray(rawMoviesData)) {
        movies = rawMoviesData;
      } else if (typeof rawMoviesData === "object") {
        movies = [rawMoviesData]; // Tek objeyi diziye çevir
      }
    }

    // Geçersiz veya eksik film verilerini filtrele (örneğin, id'si olmayanları)
    movies = movies.filter(
      (movie) => typeof movie === "object" && movie !== null && movie.id
    );
    console.log(
      "handleSubmitPrompt: İşlenmiş ve filtrelenmiş filmler:",
      movies
    );

    if (movies.length > 0) {
      console.log(
        "handleSubmitPrompt: Filmler bulundu, spinner gizleniyor ve grid gösteriliyor."
      );

      await hideLoadingSpinner(); // Önce spinner'ın kaybolmasını bekle
      displaySuggestedMoviesGrid(movies); // Sonra grid'i göster
    } else {
      console.log(
        "handleSubmitPrompt: Film bulunamadı veya geçersiz veri, spinner gizleniyor ve prompt modalı açılıyor."
      );

      await hideLoadingSpinner(); // Spinner'ı gizle
      promptError.textContent =
        "İsteğinize uygun bir film bulunamadı. Lütfen daha spesifik bir istek deneyin.";
      promptError.classList.remove("hidden");
      openPromptModal(); // Prompt modalını tekrar açıp hata göster
    }
  } catch (error) {
    await hideLoadingSpinner(); // Hata durumunda da spinner'ı gizle
    console.error(
      "handleSubmitPrompt: Film önerisi alınırken hata oluştu:",
      error
    );

    promptError.textContent = `Film önerisi alınırken bir hata oluştu: ${
      error.message || "Bilinmeyen Hata"
    }`;
    promptError.classList.remove("hidden");
    openPromptModal(); // Prompt modalını tekrar açıp hata göster
  }
}

// Örnek konu butonlarını işlevsel hale getiren kod
// const moviePromptInput = document.getElementById('moviePromptInput'); // Zaten yukarıda tanımlı
const examplePromptsContainer = document.getElementById("example-prompts");

if (examplePromptsContainer) {
  examplePromptsContainer.addEventListener("click", (e) => {
    if (e.target.classList.contains("example-prompt-btn")) {
      const promptText = e.target.textContent.trim();
      let fullPrompt = "";
      switch (promptText) {
        case "😂 Komedi":
          fullPrompt =
            "Beni çok güldürecek, eğlenceli bir komedi filmi önerir misin?";
          break;
        case "😱 Gerilim":
          fullPrompt =
            "Nefesimi kesecek, gizem ve gerilim dolu bir film arıyorum.";
          break;
        case "🤖 Bilim Kurgu":
          fullPrompt =
            "Ufuk açıcı, görsel olarak etkileyici bir bilim kurgu filmi öner.";
          break;
        case "❤️ Romantik":
          fullPrompt =
            "İçimi ısıtacak, duygusal ve romantik bir film izlemek istiyorum.";
          break;
        default:
          fullPrompt = promptText;
      }
      moviePromptInput.value = fullPrompt;
      moviePromptInput.focus();
    }
  });
}
