// js/filters.js
import { getTranslation } from './i18n.js';

// TÜR ID'LERİNİ ÇEVİRİ ANAHTARLARINA EŞLEŞTİREN HARİTA
const GENRE_ID_TO_KEY_MAP = {
  28: 'genre_Action', 12: 'genre_Adventure', 16: 'genre_Animation',
  35: 'genre_Comedy', 80: 'genre_Crime', 99: 'genre_Documentary',
  18: 'genre_Drama', 10751: 'genre_Family', 14: 'genre_Fantasy',
  36: 'genre_History', 27: 'genre_Horror', 10402: 'genre_Music',
  9648: 'genre_Mystery', 10749: 'genre_Romance', 878: 'genre_Science_Fiction',
  10770: 'genre_TV_Movie', 53: 'genre_Thriller', 10752: 'genre_War',
  37: 'genre_Western'
};

let filterModalOverlay, applyFilterBtn, clearFilterBtn, closeFilterBtn;
let yearStartInput, yearEndInput;
let onApplyCallback;

// Yeni Çift Başlıklı Slider için Değişkenler
let ratingSliderMin, ratingSliderMax, sliderProgress, ratingMinValueSpan, ratingMaxValueSpan;

export function initFilterModal(onApply) {
    filterModalOverlay = document.getElementById('filter-modal-overlay');
    applyFilterBtn = document.getElementById('apply-filter-btn');
    clearFilterBtn = document.getElementById('clear-filter-btn');
    closeFilterBtn = document.getElementById('close-filter-modal-button');

    ratingSliderMin = document.getElementById('rating-slider-min');
    ratingSliderMax = document.getElementById('rating-slider-max');
    sliderProgress = document.getElementById('slider-progress');
    ratingMinValueSpan = document.getElementById('rating-min-value');
    ratingMaxValueSpan = document.getElementById('rating-max-value');

    if (!filterModalOverlay || !ratingSliderMin) return;

    onApplyCallback = onApply;

    applyFilterBtn.addEventListener('click', handleApplyFilters);
    clearFilterBtn.addEventListener('click', handleClearFilters);
    closeFilterBtn.addEventListener('click', closeFilterModal);
    filterModalOverlay.addEventListener('click', (e) => {
        if (e.target === filterModalOverlay) {
            closeFilterModal();
        }
    });

    // DÜZELTME: Yeni slider mantığı için olay dinleyiciler
    function updateSliderProgress() {
        const minVal = parseFloat(ratingSliderMin.value);
        const maxVal = parseFloat(ratingSliderMax.value);
        ratingMinValueSpan.textContent = minVal.toFixed(1);
        ratingMaxValueSpan.textContent = maxVal.toFixed(1);

        const minPercent = ((minVal - ratingSliderMin.min) / (ratingSliderMin.max - ratingSliderMin.min)) * 100;
        const maxPercent = ((maxVal - ratingSliderMax.min) / (ratingSliderMax.max - ratingSliderMax.min)) * 100;

        sliderProgress.style.left = `${minPercent}%`;
        sliderProgress.style.right = `${100 - maxPercent}%`;
    }

    ratingSliderMin.addEventListener('input', () => {
        if (parseFloat(ratingSliderMin.value) > parseFloat(ratingSliderMax.value)) {
            ratingSliderMin.value = ratingSliderMax.value;
        }
        updateSliderProgress();
    });

    ratingSliderMax.addEventListener('input', () => {
        if (parseFloat(ratingSliderMax.value) < parseFloat(ratingSliderMin.value)) {
            ratingSliderMax.value = ratingSliderMin.value;
        }
        updateSliderProgress();
    });
}

export function openFilterModal(allMovies, currentFilters) {
    if (!filterModalOverlay) return;
    populateFilterOptions(allMovies, currentFilters);
    filterModalOverlay.classList.remove('hidden');
    setTimeout(() => filterModalOverlay.classList.add('visible'), 10);
}

function closeFilterModal() {
    if (!filterModalOverlay) return;
    filterModalOverlay.classList.remove('visible');
    filterModalOverlay.addEventListener('transitionend', () => {
        if (!filterModalOverlay.classList.contains('visible')) {
            filterModalOverlay.classList.add('hidden');
        }
    }, { once: true });
}

function populateFilterOptions(allMovies, currentFilters) {
    const genreMap = new Map(); // Yinelenen türleri engellemek için Map kullanıyoruz
    let minYear = new Date().getFullYear(), maxYear = 1900;

    allMovies.forEach(movie => {
        // Her filmin türlerini (ID ve İsim olarak) Map'e ekliyoruz
        movie.genres?.forEach(genre => genreMap.set(genre.id, genre.name));
        const releaseYear = movie.release_date ? parseInt(movie.release_date.substring(0, 4)) : 0;
        if (releaseYear) {
            if (releaseYear < minYear) minYear = releaseYear;
            if (releaseYear > maxYear) maxYear = releaseYear;
        }
    });

    const genreContainer = document.getElementById('genre-filter-container');
    genreContainer.innerHTML = '';

    // Map'teki türleri ID'ye göre sıralayıp ekrana basıyoruz
    const sortedGenres = [...genreMap.entries()].sort((a, b) => a[0] - b[0]);

    sortedGenres.forEach(([id, name]) => {
        const isChecked = currentFilters.genres?.includes(name) ? 'checked' : '';

        // TÜR ID'SİNİ KULLANARAK DOĞRU ÇEVİRİ ANAHTARINI BULUYORUZ
        const translationKey = GENRE_ID_TO_KEY_MAP[id] || `genre_${name.replace(/[\s-]/g, '_')}`;
        const translatedGenre = getTranslation(translationKey);

        // Checkbox'ın değeri orijinal (API'den gelen) isim olarak kalmalı,
        // ama kullanıcıya gösterilen metin (<span>) çevrilmiş olmalı.
        genreContainer.innerHTML += `<label class="genre-filter-label"><input type="checkbox" name="genre" value="${name}" ${isChecked}><span>${translatedGenre}</span></label>`;
    });

    const minRating = currentFilters.ratingRange ? currentFilters.ratingRange[0] : 1;
    const maxRating = currentFilters.ratingRange ? currentFilters.ratingRange[1] : 5;
    ratingSliderMin.value = minRating;
    ratingSliderMax.value = maxRating;

    ratingMinValueSpan.textContent = parseFloat(minRating).toFixed(1);
    ratingMaxValueSpan.textContent = parseFloat(maxRating).toFixed(1);
    const minPercent = ((minRating - ratingSliderMin.min) / (ratingSliderMin.max - ratingSliderMin.min)) * 100;
    const maxPercent = ((maxRating - ratingSliderMax.min) / (ratingSliderMax.max - ratingSliderMax.min)) * 100;
    sliderProgress.style.left = `${minPercent}%`;
    sliderProgress.style.right = `${100 - maxPercent}%`;

    yearStartInput = document.getElementById('year-start-input');
    yearEndInput = document.getElementById('year-end-input');
    yearStartInput.placeholder = minYear;
    yearEndInput.placeholder = maxYear;
    yearStartInput.value = currentFilters.yearRange ? currentFilters.yearRange[0] || '' : '';
    yearEndInput.value = currentFilters.yearRange ? currentFilters.yearRange[1] || '' : '';
}

function handleApplyFilters() {
    const selectedGenres = [...document.querySelectorAll('#genre-filter-container input:checked')].map(el => el.value);
    const ratingRange = [parseFloat(ratingSliderMin.value), parseFloat(ratingSliderMax.value)];
    const yearRange = [parseInt(yearStartInput.value, 10) || null, parseInt(yearEndInput.value, 10) || null];

    const activeFilters = {};
    if (selectedGenres.length > 0) activeFilters.genres = selectedGenres;
    if (ratingRange[0] > 1 || ratingRange[1] < 5) activeFilters.ratingRange = ratingRange;
    if (yearRange[0] || yearRange[1]) activeFilters.yearRange = yearRange;

    onApplyCallback(activeFilters);
    closeFilterModal();
}

function handleClearFilters() {
    onApplyCallback({});
    closeFilterModal();
}

export function applyFilters(movies, filters) {
    return movies.filter(movie => {
        if (filters.genres && filters.genres.length > 0) {
            const movieGenres = movie.genres?.map(g => g.name) || [];
            if (!filters.genres.some(filterGenre => movieGenres.includes(filterGenre))) return false;
        }
        if (filters.ratingRange) {
            if (!movie.rating || movie.rating < filters.ratingRange[0] || movie.rating > filters.ratingRange[1]) return false;
        }
        if (filters.yearRange) {
            const releaseYear = movie.release_date ? parseInt(movie.release_date.substring(0, 4)) : 0;
            if (!releaseYear) return false;
            if (filters.yearRange[0] && releaseYear < filters.yearRange[0]) return false;
            if (filters.yearRange[1] && releaseYear > filters.yearRange[1]) return false;
        }
        return true;
    });
}