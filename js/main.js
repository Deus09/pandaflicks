// js/main.js
import { initAuth, handleAnonymousSignIn } from './auth.js';
import { loadMoviesFromFirestore, clearMovieLists } from './storage.js';
import { showSection, setupListViewControls, updateProfileView } from './sections.js';
import { setupEventListeners } from './events.js';
import { handleMovieFormSubmit } from './modals.js';
import { initBadgeInfoModal } from './badge-modal.js';
import { initChat } from './chat.js'; // YENİ
import { initMovieSuggestion } from './movie-suggestion.js'; // YENİ


/**
 * Shows the main application UI and hides the splash screen.
 */
function showAppUI() {
    const splashScreen = document.getElementById('splash-screen');
    const mainContainer = document.getElementById('main-container');

    if (mainContainer.classList.contains('hidden')) {
        console.log('UI is not visible, showing it now...');
        mainContainer.classList.remove('hidden');
        showSection('my-watched-movies-section');

        splashScreen.classList.add('fade-out');
        splashScreen.addEventListener('transitionend', () => splashScreen.style.display = 'none', { once: true });
    }
}

/**
 * Initializes the application.
 */
function initializeApp() {
    console.log('initializeApp: Starting application...');
    
    // Gerekli tüm başlatmaları yap
    document.getElementById('movie-form').addEventListener('submit', handleMovieFormSubmit);
    setupEventListeners();
    setupListViewControls();
    initBadgeInfoModal();
    initChat();
    initMovieSuggestion(); // YENİ

    let isUiReady = false;

    // Set up the persistent listener for auth state changes.
    initAuth((user) => {
        if (user) {
            console.log('Auth state changed. User found:', user.isAnonymous ? 'Anonymous' : 'Authenticated', user.uid);
            
            if (!isUiReady) {
                showAppUI();
                isUiReady = true;
            }

            loadMoviesFromFirestore(user.uid);
        } else {
            console.log('Auth state changed. No user found. Signing in anonymously...');
            clearMovieLists();
            updateProfileView(null);
            
            handleAnonymousSignIn().catch(err => {
                 console.error("Critical: Failed to sign in anonymously on initialization.", err);
                 const splash = document.getElementById('splash-screen');
                 splash.innerHTML = `<div class="text-center text-white p-4"><h1>Uygulama başlatılamadı</h1><p>Firebase bağlantısı kurulamadı.</p></div>`;
            });
        }
    });
}

document.addEventListener('DOMContentLoaded', initializeApp);