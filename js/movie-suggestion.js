import { fetchSuggestedMovie } from './api.js';
import { openMovieDetailsModal, showLoadingSpinner, hideLoadingSpinner } from './modals.js';
import { isUserPro } from './user.js'; // YENİ: import ekle
import { showPaywall } from './paywall.js'; // YENİ: import ekle
import { onModalOpen, onModalClose } from './scroll-lock.js'; // BU SATIRI EKLEYİN
import { getTranslation } from './i18n.js';



// --- DOM Elementleri ---
let suggestMovieBtn;
let promptModalOverlay;
let closePromptModalBtn;
let moviePromptInput;
let submitPromptBtn;
let promptError;

// Öneri sonuç modalı için DOM elementleri
let suggestionResultOverlay;
let closeSuggestionResultBtn;
let suggestionGrid;
let tryAgainBtn;

// Son girilen prompt'u saklamak için değişken
let lastPrompt = '';

/**
 * Film öneri özelliğini başlatır ve olay dinleyicilerini ayarlar.
 */
export function initMovieSuggestion() {
    suggestMovieBtn = document.getElementById('suggestMovieBtn');
    promptModalOverlay = document.getElementById('promptModalOverlay');
    closePromptModalBtn = document.getElementById('closePromptModalBtn');
    moviePromptInput = document.getElementById('moviePromptInput');
    submitPromptBtn = document.getElementById('submitPromptBtn');
    promptError = document.getElementById('promptError');

    suggestionResultOverlay = document.getElementById('suggestionResultOverlay');
    closeSuggestionResultBtn = document.getElementById('closeSuggestionResultBtn');
    suggestionGrid = document.getElementById('suggestionGrid');
    tryAgainBtn = document.getElementById('tryAgainBtn');

    if (!suggestMovieBtn || !promptModalOverlay || !suggestionResultOverlay) {
        console.error('Film öneri DOM elementlerinden bazıları bulunamadı.');
        return;
    }

    // Olay Dinleyicileri
    suggestMovieBtn.addEventListener('click', () => {
        if (isUserPro()) {
            openPromptModal();
        } else {
            // Şimdilik sadece bir uyarı gösterelim.
            // Bir sonraki adımda buraya Paywall ekranını açan kodu yazacağız.
            showPaywall(); // GÜNCELLEME: alert yerine paywall göster
        }
    });

    closePromptModalBtn.addEventListener('click', closePromptModal);
    promptModalOverlay.addEventListener('click', (e) => {
        if (e.target === promptModalOverlay) closePromptModal();
    });
    submitPromptBtn.addEventListener('click', handleSubmitPrompt);
    closeSuggestionResultBtn.addEventListener('click', closeSuggestionResultModal);
    suggestionResultOverlay.addEventListener('click', (e) => {
        if (e.target === suggestionResultOverlay) closeSuggestionResultModal();
    });
    tryAgainBtn.addEventListener('click', handleTryAgain);
}

/**
 * Prompt modalını açar.
 */
function openPromptModal() {
    onModalOpen(); // BU SATIRI EKLEYİN

    moviePromptInput.value = '';
    promptError.textContent = '';
    promptError.classList.add('hidden');
    promptModalOverlay.classList.remove('hidden');
    setTimeout(() => promptModalOverlay.classList.add('visible'), 10);
}

/**
 * Prompt modalını kapatır.
 */
function closePromptModal() {
    onModalClose(); // BU SATIRI EKLEYİN

    promptModalOverlay.classList.remove('visible');

    setTimeout(() => {
        const isAnotherModalVisible = document.querySelector('.modal-overlay.visible');
        if (!isAnotherModalVisible) {
        }
    }, 100);

    promptModalOverlay.addEventListener('transitionend', () => {
        if (!promptModalOverlay.classList.contains('visible')) {
            promptModalOverlay.classList.add('hidden');
        }
    }, { once: true });
}

/**
 * Öneri sonuç modalını açar
 * @param {Array} movies - Gösterilecek film nesneleri dizisi.
 */
function openSuggestionResultModal(movies) {
    onModalOpen(); // BU SATIRI EKLEYİN

    renderSuggestionGrid(movies);
    suggestionResultOverlay.classList.remove('hidden');
    setTimeout(() => suggestionResultOverlay.classList.add('visible'), 10);
}

/**
 * Öneri sonuç modalını kapatır
 */
function closeSuggestionResultModal() {
    onModalClose(); // BU SATIRI EKLEYİN

    suggestionResultOverlay.classList.remove('visible');

    setTimeout(() => {
        const isAnotherModalVisible = document.querySelector('.modal-overlay.visible');
        if (!isAnotherModalVisible) {
        }
    }, 100);

    suggestionResultOverlay.addEventListener('transitionend', () => {
        if (!suggestionResultOverlay.classList.contains('visible')) {
            suggestionResultOverlay.classList.add('hidden');
        }
    }, { once: true });
}

/**
 * 4'lü film grid'ini oluşturur ve DOM'a ekler.
 * @param {Array} movies - Gösterilecek film nesneleri dizisi.
 */
function renderSuggestionGrid(movies) {
    suggestionGrid.innerHTML = '';
    movies.slice(0, 4).forEach(movie => {
        if (!movie || !movie.id) return;

        const posterItem = document.createElement('div');
        posterItem.className = 'suggestion-poster-item';

        const posterImg = document.createElement('img');
        posterImg.src = movie.poster_path
            ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
            : 'https://placehold.co/400x600/2A2A2A/AAAAAA?text=Poster+Yok';
        posterImg.alt = movie.title;
        posterImg.onerror = function () { this.onerror = null; this.src = 'https://placehold.co/400x600/2A2A2A/AAAAAA?text=Poster+Yok'; };

        posterItem.appendChild(posterImg);

        posterItem.addEventListener('click', () => {
            openMovieDetailsModal(movie.id, true);
        });

        suggestionGrid.appendChild(posterItem);
    });
}

/**
 * "Yeniden Dene" butonuna basıldığında çalışır.
 */
async function handleTryAgain() {
    if (!lastPrompt) return;
    closeSuggestionResultModal();
    await fetchAndDisplaySuggestions(true);
}

/**
 * Kullanıcının ilk prompt'unu alır ve gönderme işlemini başlatır.
 */
async function handleSubmitPrompt() {
    const promptText = moviePromptInput.value.trim();
    if (!promptText) {
        promptError.textContent = 'Lütfen bir film öneri isteği girin.';
        promptError.classList.remove('hidden');
        return;
    }
    lastPrompt = promptText;
    promptError.classList.add('hidden');

    closePromptModal();
    await fetchAndDisplaySuggestions();
}

/**
 * API'dan önerileri alır, yükleme ekranını yönetir ve sonuçları gösterir.
 * @param {boolean} [isRetry=false] - Bu çağrının yeniden deneme olup olmadığını belirtir.
 */
async function fetchAndDisplaySuggestions(isRetry = false) {
    const spinnerText = isRetry ? getTranslation('ai_loading_retry') : getTranslation('ai_loading_initial');
    showLoadingSpinner(spinnerText);

    try {
        const data = await fetchSuggestedMovie(lastPrompt, isRetry);
        hideLoadingSpinner();

        if (data && data.movies && data.movies.length > 0) {
            openSuggestionResultModal(data.movies);
        } else {
            const errorMessage = data.error || 'İsteğine uygun filmler bulunamadı. Lütfen daha farklı bir dilde veya içerikte tekrar dene.';
            openPromptModal();
            promptError.textContent = errorMessage;
            promptError.classList.remove('hidden');
        }
    } catch (error) {
        hideLoadingSpinner();
        console.error('Film önerisi alınırken hata:', error);
        openPromptModal();
        promptError.textContent = `Bir hata oluştu: ${error.message}`;
        promptError.classList.remove('hidden');
    }
}