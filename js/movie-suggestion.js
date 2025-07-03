import { fetchSuggestedMovie } from './api.js';
import { openMovieDetailsModal, showLoadingSpinner, hideLoadingSpinner } from './modals.js';

// --- DOM Elementleri ---
let suggestMovieBtn;
let promptModalOverlay;
let closePromptModalBtn;
let moviePromptInput;
let submitPromptBtn;
let promptError;

// YENİ: Öneri sonuç modalı için DOM elementleri
let suggestionResultOverlay;
let closeSuggestionResultBtn;
let suggestionGrid;
let tryAgainBtn;

// YENİ: Son girilen prompt'u saklamak için değişken
let lastPrompt = '';

/**
 * Film öneri özelliğini başlatır ve olay dinleyicilerini ayarlar.
 */
export function initMovieSuggestion() {
    // Mevcut elementler
    suggestMovieBtn = document.getElementById('suggestMovieBtn');
    promptModalOverlay = document.getElementById('promptModalOverlay');
    closePromptModalBtn = document.getElementById('closePromptModalBtn');
    moviePromptInput = document.getElementById('moviePromptInput');
    submitPromptBtn = document.getElementById('submitPromptBtn');
    promptError = document.getElementById('promptError');

    // YENİ: Yeni modal elementleri
    suggestionResultOverlay = document.getElementById('suggestionResultOverlay');
    closeSuggestionResultBtn = document.getElementById('closeSuggestionResultBtn');
    suggestionGrid = document.getElementById('suggestionGrid');
    tryAgainBtn = document.getElementById('tryAgainBtn');

    if (!suggestMovieBtn || !promptModalOverlay || !suggestionResultOverlay) {
        console.error('Film öneri DOM elementlerinden bazıları bulunamadı.');
        return;
    }

    // Mevcut Olay Dinleyicileri
    suggestMovieBtn.addEventListener('click', openPromptModal);
    closePromptModalBtn.addEventListener('click', closePromptModal);
    promptModalOverlay.addEventListener('click', (e) => {
        if (e.target === promptModalOverlay) closePromptModal();
    });
    submitPromptBtn.addEventListener('click', handleSubmitPrompt);

    // YENİ: Yeni Olay Dinleyicileri
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
    moviePromptInput.value = '';
    promptError.textContent = '';
    promptError.classList.add('hidden');
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
 * YENİ: Öneri sonuç modalını açar
 * @param {Array} movies - Gösterilecek film nesneleri dizisi.
 */
function openSuggestionResultModal(movies) {
    renderSuggestionGrid(movies);
    suggestionResultOverlay.classList.remove('hidden');
    document.body.classList.add('no-scroll');
    setTimeout(() => suggestionResultOverlay.classList.add('visible'), 10);
}

/**
 * YENİ: Öneri sonuç modalını kapatır
 */
function closeSuggestionResultModal() {
    suggestionResultOverlay.classList.remove('visible');
    document.body.classList.remove('no-scroll');
    suggestionResultOverlay.addEventListener('transitionend', () => {
        if (!suggestionResultOverlay.classList.contains('visible')) {
            suggestionResultOverlay.classList.add('hidden');
        }
    }, { once: true });
}

/**
 * YENİ: 4'lü film grid'ini oluşturur ve DOM'a ekler.
 * @param {Array} movies - Gösterilecek film nesneleri dizisi.
 */
function renderSuggestionGrid(movies) {
    suggestionGrid.innerHTML = ''; // Önceki sonuçları temizle
    movies.slice(0, 4).forEach(movie => { // En fazla 4 film göster
        if (!movie || !movie.id) return; // Geçersiz film verisini atla

        const posterItem = document.createElement('div');
        posterItem.className = 'suggestion-poster-item';
        
        const posterImg = document.createElement('img');
        posterImg.src = movie.poster_path 
            ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
            : 'https://placehold.co/400x600/2A2A2A/AAAAAA?text=Poster+Yok';
        posterImg.alt = movie.title;
        posterImg.onerror = function() { this.onerror=null; this.src='https://placehold.co/400x600/2A2A2A/AAAAAA?text=Poster+Yok'; };

        posterItem.appendChild(posterImg);
        
        posterItem.addEventListener('click', () => {
            openMovieDetailsModal(movie.id);
        });

        suggestionGrid.appendChild(posterItem);
    });
}

/**
 * YENİ: "Yeniden Dene" butonuna basıldığında çalışır.
 */
async function handleTryAgain() {
    if (!lastPrompt) return;
    closeSuggestionResultModal();
    await fetchAndDisplaySuggestions();
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
    lastPrompt = promptText; // Prompt'u "Yeniden Dene" için sakla
    promptError.classList.add('hidden');
    
    closePromptModal();
    await fetchAndDisplaySuggestions();
}

/**
 * YENİ ve MERKEZİ FONKSİYON: API'dan önerileri alır, yükleme ekranını yönetir ve sonuçları gösterir.
 */
async function fetchAndDisplaySuggestions() {
    showLoadingSpinner("Sana özel 4 öneri hazırlanıyor...");

    try {
        const data = await fetchSuggestedMovie(lastPrompt);
        hideLoadingSpinner();

        if (data && data.movies && data.movies.length > 0) {
            openSuggestionResultModal(data.movies);
        } else {
            // API'den bir hata mesajı geldiyse onu göster, yoksa genel bir mesaj göster.
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