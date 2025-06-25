// js/movie-suggestion.js
import { openMovieDetailsModal } from './modals.js';
import { fetchSuggestedMovie } from './api.js';

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
    suggestMovieBtn = document.getElementById('suggestMovieBtn');
    promptModalOverlay = document.getElementById('promptModalOverlay');
    closePromptModalBtn = document.getElementById('closePromptModalBtn');
    moviePromptInput = document.getElementById('moviePromptInput');
    submitPromptBtn = document.getElementById('submitPromptBtn');
    promptError = document.getElementById('promptError');
    loadingSpinnerOverlay = document.getElementById('loadingSpinnerOverlay');

    if (!suggestMovieBtn || !promptModalOverlay) {
        console.error('Film öneri modalı DOM elementleri bulunamadı.');
        return;
    }

    // Olay Dinleyicileri
    suggestMovieBtn.addEventListener('click', openPromptModal);
    closePromptModalBtn.addEventListener('click', closePromptModal);
    promptModalOverlay.addEventListener('click', (e) => {
        if (e.target === promptModalOverlay) {
            closePromptModal();
        }
    });
    submitPromptBtn.addEventListener('click', handleSubmitPrompt);
}

/**
 * Prompt modalını açar.
 */
function openPromptModal() {
    moviePromptInput.value = ''; // Önceki prompt'u temizle
    promptError.textContent = ''; // Hata mesajını temizle
    promptError.classList.add('hidden'); // Hata mesajını gizle
    promptModalOverlay.classList.remove('hidden');
    document.body.classList.add('no-scroll');
    setTimeout(() => promptModalOverlay.classList.add('visible'), 10);
}

/**
 * Prompt modalını kapatır.
 */
function closePromptModal() {
    promptModalOverlay.classList.remove('visible');
    document.body.classList.remove('no-scroll');
    promptModalOverlay.addEventListener('transitionend', () => {
        if (!promptModalOverlay.classList.contains('visible')) {
            promptModalOverlay.classList.add('hidden');
        }
    }, { once: true });
}

/**
 * Yükleniyor spinner'ını gösterir.
 */
function showLoadingSpinner() {
    loadingSpinnerOverlay.classList.remove('hidden');
    document.body.classList.add('no-scroll');
    setTimeout(() => loadingSpinnerOverlay.classList.add('visible'), 10);
}

/**
 * Yükleniyor spinner'ını gizler.
 */
function hideLoadingSpinner() {
    loadingSpinnerOverlay.classList.remove('visible');
    document.body.classList.remove('no-scroll');
    loadingSpinnerOverlay.addEventListener('transitionend', () => {
        if (!loadingSpinnerOverlay.classList.contains('visible')) {
            loadingSpinnerOverlay.classList.add('hidden');
        }
    }, { once: true });
}

/**
 * Kullanıcının prompt'unu gönderir ve film önerisi alır.
 */
async function handleSubmitPrompt() {
    const promptText = moviePromptInput.value.trim();
    if (!promptText) {
        promptError.textContent = 'Lütfen bir film önerisi isteği girin.';
        promptError.classList.remove('hidden');
        return;
    }

    promptError.classList.add('hidden'); // Hata mesajını temizle
    closePromptModal(); // Prompt modalını kapat
    showLoadingSpinner(); // Yükleniyor spinner'ını göster

    try {
        const movieData = await fetchSuggestedMovie(promptText);
        if (movieData && movieData.id) {
            openMovieDetailsModal(movieData.id); // Mevcut detay modalını kullan
        } else {
            // Film bulunamadıysa veya API'den boş yanıt geldiyse
            promptError.textContent = 'İsteğinize uygun bir film bulunamadı. .Lütfen daha spesifik bir istek deneyin.';
            promptError.classList.remove('hidden');
            openPromptModal(); // Prompt modalını tekrar açıp hata göster
        }
    } catch (error) {
        console.error('Film önerisi alınırken hata:', error);
        promptError.textContent = `Film önerisi alınırken bir hata oluştu: ${error.message}`;
        promptError.classList.remove('hidden');
        openPromptModal(); // Prompt modalını tekrar açıp hata göster
    } finally {
        hideLoadingSpinner(); // Yükleniyor spinner'ını kapat
    }
}