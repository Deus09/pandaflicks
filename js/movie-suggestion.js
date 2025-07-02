// js/movie-suggestion.js
import { fetchSuggestedMovie } from './api.js';
import { openMovieDetailsModal } from './modals.js';



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
 * Kullanıcının prompt'unu gönderir ve film önerisi alır.
 */
async function handleSubmitPrompt() {
    const promptText = moviePromptInput.value.trim();
    if (!promptText) {
        promptError.textContent = 'Lütfen bir film öneri isteği girin.';
        promptError.classList.remove('hidden');
        return;
    }

    // --- Yükleme Durumuna Geçiş ---
    promptError.classList.add('hidden'); // Önceki hataları temizle
    submitPromptBtn.classList.add('loading'); // Butona loading sınıfı ekle
    submitPromptBtn.disabled = true; // Butonu devre dışı bırak
    moviePromptInput.disabled = true; // Yazı alanını devre dışı bırak

    try {
        const movieData = await fetchSuggestedMovie(promptText);

        if (movieData && movieData.id) {
            // BAŞARILI: Film bulundu, şimdi modalları yönet
            closePromptModal(); 
            openMovieDetailsModal(movieData.id);
        } else {
            // BAŞARISIZ: Film bulunamadı, hatayı modal içinde göster
            promptError.textContent = 'İsteğinize uygun bir film bulunamadı. Lütfen daha farklı bir istek deneyin.';
            promptError.classList.remove('hidden');
        }
    } catch (error) {
        // HATA: API hatası oluştu, hatayı modal içinde göster
        console.error('Film önerisi alınırken hata:', error);
        promptError.textContent = `Bir hata oluştu: ${error.message}`;
        promptError.classList.remove('hidden');
    } finally {
        // --- Yükleme Durumundan Çıkış ---
        // İşlem başarılı da olsa, hatalı da olsa butonları tekrar aktif et
        submitPromptBtn.classList.remove('loading');
        submitPromptBtn.disabled = false;
        moviePromptInput.disabled = false;
    }
}


