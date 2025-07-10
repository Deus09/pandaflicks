// js/tools.js
import { getTranslation } from './i18n.js';
import { refreshWatchedMoviesList } from './sections.js';

// --- DOM Elementleri ---
let toolsOverlay, listOptionsBtn;

// --- Durum Değişkenleri ---
let currentFilters = {};
let currentSortCriteria = 'date-desc';

// Sıralama seçenekleri (anahtar ve çeviri anahtarı)
const SORT_OPTIONS = [
    { key: 'date-desc', labelKey: 'sort_by_date_desc' },
    { key: 'date-asc', labelKey: 'sort_by_date_asc' },
    { key: 'rating-desc', labelKey: 'sort_by_rating_desc' },
    { key: 'rating-asc', labelKey: 'sort_by_rating_asc' },
    { key: 'title-asc', labelKey: 'sort_by_title_asc' },
];

// Popüler Türler Listesi (Bunlar çeviri anahtarlarıdır)
const COMMON_GENRE_KEYS = [
    'genre_Action', 'genre_Adventure', 'genre_Animation', 'genre_Comedy', 
    'genre_Crime', 'genre_Documentary', 'genre_Drama', 'genre_Family', 
    'genre_Fantasy', 'genre_History', 'genre_Horror', 'genre_Music', 
    'genre_Mystery', 'genre_Romance', 'genre_Science_Fiction', 'genre_Thriller', 
    'genre_War', 'genre_Western'
];

export function initToolsMenu() {
    toolsOverlay = document.getElementById('tools-overlay');
    listOptionsBtn = document.getElementById('list-options-btn');

    if (!toolsOverlay || !listOptionsBtn) return;

    listOptionsBtn.addEventListener('click', openToolsMenu);
    toolsOverlay.addEventListener('click', (e) => {
        if (e.target === toolsOverlay) closeToolsMenu();
    });

    toolsOverlay.addEventListener('click', (e) => {
        if (e.target.id === 'tools-apply-btn') handleApply();
        if (e.target.id === 'tools-clear-btn') handleClear();
    });

    const minSlider = document.getElementById('tools-rating-slider-min');
    const maxSlider = document.getElementById('tools-rating-slider-max');
    if(minSlider && maxSlider) {
        minSlider.addEventListener('input', updateSliderVisuals);
        maxSlider.addEventListener('input', updateSliderVisuals);
    }
}

function openToolsMenu() {
    populateSortOptions();
    populateFilterOptions();
    updateSliderVisuals();
    toolsOverlay.classList.remove('hidden');
}

function closeToolsMenu() {
    toolsOverlay.classList.add('hidden');
}

function populateSortOptions() {
    const container = document.getElementById('tools-sort-options');
    container.innerHTML = '';
    SORT_OPTIONS.forEach(option => {
        const button = document.createElement('button');
        button.className = 'tool-sort-option';
        button.dataset.sort = option.key;
        // DÜZELTME: Artık çeviriyi doğrudan buradan alıyoruz.
        button.textContent = getTranslation(option.labelKey);
        if (currentSortCriteria === option.key) {
            button.classList.add('active');
        }
        button.addEventListener('click', () => {
            currentSortCriteria = option.key;
            container.querySelectorAll('.tool-sort-option').forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
        });
        container.appendChild(button);
    });
}

function populateFilterOptions() {
    const genreContainer = document.getElementById('tools-genre-filter-container');
    genreContainer.innerHTML = '';

    // DÜZELTME: Sabit anahtar listemizi kullanarak butonları oluşturuyoruz.
    COMMON_GENRE_KEYS.forEach(genreKey => {
        const translatedGenre = getTranslation(genreKey);
        const isChecked = currentFilters.genres?.includes(translatedGenre) ? 'checked' : '';

        genreContainer.innerHTML += `<label class="genre-filter-label"><input type="checkbox" name="genre" value="${translatedGenre}" ${isChecked}><span>${translatedGenre}</span></label>`;
    });
}

function handleApply() {
    const selectedGenres = [...document.querySelectorAll('#tools-genre-filter-container input:checked')].map(el => el.value);
    const minRating = parseFloat(document.getElementById('tools-rating-slider-min').value);
    const maxRating = parseFloat(document.getElementById('tools-rating-slider-max').value);

    currentFilters = {};
    if (selectedGenres.length > 0) currentFilters.genres = selectedGenres;
    if (minRating > 1 || maxRating < 5) currentFilters.ratingRange = [minRating, maxRating];

    refreshWatchedMoviesList(currentFilters, currentSortCriteria);
    closeToolsMenu();
}

function handleClear() {
    currentFilters = {};
    currentSortCriteria = 'date-desc';
    refreshWatchedMoviesList({}, 'date-desc');
    closeToolsMenu();
}

// SLIDER GÖRSELLERİNİ VE DEĞERLERİNİ GÜNCELLEYEN FONKSİYON
function updateSliderVisuals() {
    const minSlider = document.getElementById("tools-rating-slider-min");
    const maxSlider = document.getElementById("tools-rating-slider-max");
    const minValueSpan = document.getElementById("tools-rating-min-value");
    const maxValueSpan = document.getElementById("tools-rating-max-value");
    const sliderProgress = document.getElementById("tools-slider-progress");
    if (!minSlider || !maxSlider || !minValueSpan || !maxValueSpan || !sliderProgress)
        return;
    let minVal = parseFloat(minSlider.value);
    let maxVal = parseFloat(maxSlider.value); // Slider'ların birbiri üzerinden geçmesini engelle
    if (minVal > maxVal) {
        [minVal, maxVal] = [maxVal, minVal]; // Değerleri takas et
        minSlider.value = minVal;
        maxSlider.value = maxVal;
    }
    minValueSpan.textContent = minVal.toFixed(1);
    maxValueSpan.textContent = maxVal.toFixed(1);
    const minPercent =
        ((minVal - minSlider.min) / (minSlider.max - minSlider.min)) * 100;
    const maxPercent =
        ((maxVal - minSlider.min) / (maxSlider.max - minSlider.min)) * 100;
    sliderProgress.style.left = `${minPercent}%`;
    sliderProgress.style.right = `${100 - maxPercent}%`;
}