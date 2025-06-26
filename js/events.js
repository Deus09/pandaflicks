<<<<<<< HEAD
// js/events.js
import { openMovieMode, closeMovieMode, openMovieDetailsModal, closeMovieDetailsModal } from './modals.js';
import { searchTmdbMovies } from './api.js';
import { displayTmdbSearchResults } from './render.js';
import { setupStarRating } from './rating.js';
import { enhanceCommentWithGemini } from './gemini.js';
import { showSection } from './sections.js';
import { showNotification } from './utils.js';
import { handleSignIn, handleSignUp, handleSignOut } from './auth.js';

export function setupEventListeners() {
    const movieModalOverlay = document.getElementById('movie-modal-overlay');
    const addMovieFloatButton = document.getElementById('add-movie-float-button');
    const movieDetailsModalOverlay = document.getElementById('movie-details-modal-overlay');
    const closeDetailModalButton = document.getElementById('close-detail-modal-button');
    const movieTitleInput = document.getElementById('movie-title-input');
    const movieCommentInput = document.getElementById('movie-comment-input');
    const enhanceCommentButton = document.getElementById('enhance-comment-button');
    const tmdbSearchResultsDiv = document.getElementById('tmdb-search-results');
    const tmdbSearchMessage = document.getElementById('tmdb-search-message');
    let tmdbSearchTimeout;
    const movieDateInput = document.getElementById('movie-date-input');
    const movieRatingInputDiv = document.getElementById('movie-rating-input');
    const watchLaterCheckbox = document.getElementById('watch-later-checkbox');
    const cancelButton = document.getElementById('cancel-button');
    const signOutButton = document.getElementById('sign-out-button');
    
    const emailAuthForm = document.getElementById('email-auth-form');
    const authTabLogin = document.getElementById('auth-tab-login');
    const authTabSignup = document.getElementById('auth-tab-signup');
    const authSubmitButton = document.getElementById('auth-submit-button');
    const authErrorMessage = document.getElementById('auth-error-message');
    const authEmailInput = document.getElementById('auth-email');
    const authEmailError = document.getElementById('auth-email-error');
    const authPasswordInput = document.getElementById('auth-password');
    const authPasswordToggle = document.getElementById('auth-password-toggle');
    const eyeOpenIcon = document.getElementById('eye-open-icon');
    const eyeClosedIcon = document.getElementById('eye-closed-icon');

    // Navigation
    document.getElementById('nav-my-log').addEventListener('click', (e) => { e.preventDefault(); showSection('my-watched-movies-section'); });
    document.getElementById('nav-trending').addEventListener('click', (e) => { e.preventDefault(); showSection('trending-movies-section'); });
    document.getElementById('nav-lists').addEventListener('click', (e) => { e.preventDefault(); showSection('special-lists-section'); });
    document.getElementById('nav-watch-later').addEventListener('click', (e) => { e.preventDefault(); showSection('watch-later-movies-section'); });
    document.getElementById('nav-profile').addEventListener('click', (e) => { e.preventDefault(); showSection('profile-section'); });
    
    if (signOutButton) signOutButton.addEventListener('click', handleSignOut);
    if (addMovieFloatButton) addMovieFloatButton.addEventListener('click', (e) => { e.preventDefault(); openMovieMode(); });

    // Modals
    cancelButton.addEventListener('click', () => closeMovieMode(movieModalOverlay));
    movieModalOverlay.addEventListener('click', (e) => { if (e.target === movieModalOverlay) closeMovieMode(movieModalOverlay); });
    
    if (closeDetailModalButton) {
        closeDetailModalButton.addEventListener('click', () => closeMovieDetailsModal());
    }
    if (movieDetailsModalOverlay) {
        movieDetailsModalOverlay.addEventListener('click', (e) => { 
            if (e.target === movieDetailsModalOverlay) {
                closeMovieDetailsModal();
            }
        });
    }
    
    authEmailInput.addEventListener('input', () => {
        const email = authEmailInput.value;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (emailRegex.test(email) || email === '') {
            authEmailError.classList.add('hidden');
            authEmailInput.parentElement.classList.remove('invalid');
        } else {
            authEmailError.classList.remove('hidden');
            authEmailInput.parentElement.classList.add('invalid');
        }
    });

    authPasswordToggle.addEventListener('click', () => {
        const isPassword = authPasswordInput.type === 'password';
        authPasswordInput.type = isPassword ? 'text' : 'password';
        eyeOpenIcon.classList.toggle('hidden', isPassword);
        eyeClosedIcon.classList.toggle('hidden', !isPassword);
    });

    if (emailAuthForm) {
        authTabLogin.addEventListener('click', () => {
            authTabLogin.classList.add('active');
            authTabSignup.classList.remove('active');
            authSubmitButton.textContent = 'Giriş Yap';
            authErrorMessage.classList.add('hidden');
        });

        authTabSignup.addEventListener('click', () => {
            authTabSignup.classList.add('active');
            authTabLogin.classList.remove('active');
            authSubmitButton.textContent = 'Kayıt Ol';
            authErrorMessage.classList.add('hidden');
        });

        emailAuthForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = authEmailInput.value;
            const password = authPasswordInput.value;
            const isLogin = authTabLogin.classList.contains('active');
            authErrorMessage.classList.add('hidden');
            authSubmitButton.disabled = true;

            try {
                if (isLogin) {
                    await handleSignIn(email, password);
                    showNotification('Başarıyla giriş yapıldı!', 'success');
                } else {
                    await handleSignUp(email, password);
                    await handleSignOut(); 
                    showNotification('Hesabınız oluşturuldu, lütfen giriş yapınız.', 'info', 6000);
                    authTabLogin.classList.add('active');
                    authTabSignup.classList.remove('active');
                    authSubmitButton.textContent = 'Giriş Yap';
                    emailAuthForm.reset();
                }
            } catch (error) {
                console.error("Authentication Error:", error);
                authErrorMessage.textContent = getFriendlyAuthError(error);
                authErrorMessage.classList.remove('hidden');
            } finally {
                authSubmitButton.disabled = false;
            }
        });
    }

    function getFriendlyAuthError(error) {
        switch (error.code) {
            case 'auth/invalid-email': return 'Lütfen geçerli bir e-posta adresi girin.';
            case 'auth/user-not-found':
            case 'auth/wrong-password':
            case 'auth/invalid-credential': return 'E-posta veya parola hatalı. Lütfen kontrol edin.';
            case 'auth/email-already-in-use': return 'Bu e-posta adresi zaten başka bir hesap tarafından kullanılıyor.';
            case 'auth/weak-password': return 'Parolanız en az 6 karakter uzunluğunda olmalıdır.';
            default: return 'Bir hata oluştu. Lütfen daha sonra tekrar deneyin.';
        }
    }

    watchLaterCheckbox.addEventListener('change', () => {
        const ratingGroup = movieRatingInputDiv.parentElement;
        const watchedDateGroup = document.getElementById('watched-date-group');
        const chatWithCharacterButton = document.getElementById('chat-with-character-button');
        const hasTmdbId = !!document.getElementById('movie-tmdb-id').value;

        if (watchLaterCheckbox.checked) {
            movieDateInput.disabled = true;
            movieDateInput.required = false;
            watchedDateGroup.style.display = 'none';
            ratingGroup.style.display = 'none';
            movieRatingInputDiv.innerHTML = '';
            enhanceCommentButton.style.display = 'none';
            chatWithCharacterButton.classList.add('hidden'); // DÜZELTME
        } else {
            movieDateInput.disabled = false;
            movieDateInput.required = true;
            watchedDateGroup.style.display = 'block';
            ratingGroup.style.display = 'block';
            setupStarRating(movieRatingInputDiv, 0);
            enhanceCommentButton.style.display = 'block';
            if (hasTmdbId) { // DÜZELTME
                chatWithCharacterButton.classList.remove('hidden');
            }
        }
    });

    movieTitleInput.addEventListener('input', () => {
        if (movieTitleInput.readOnly) return;
        clearTimeout(tmdbSearchTimeout);
        tmdbSearchTimeout = setTimeout(() => {
            searchTmdbMovies(movieTitleInput.value, tmdbSearchResultsDiv, tmdbSearchMessage, displayTmdbSearchResults);
        }, 300);
    });
    
    enhanceCommentButton.addEventListener('click', async () => {
        const currentComment = movieCommentInput.value.trim();
        if (currentComment.length < 10) {
            showNotification('Lütfen yorumunuzu geliştirmek için en az 10 karakter girin.', 'error');
            return;
        }
        await enhanceCommentWithGemini(currentComment, movieTitleInput.value, movieCommentInput, enhanceCommentButton);
    });
=======
// js/events.js
import { openMovieMode, closeMovieMode, openMovieDetailsModal, closeMovieDetailsModal } from './modals.js';
import { searchTmdbMovies } from './api.js';
import { displayTmdbSearchResults } from './render.js';
import { setupStarRating } from './rating.js';
import { enhanceCommentWithGemini } from './gemini.js';
import { showSection } from './sections.js';
import { showNotification } from './utils.js';
import { handleSignIn, handleSignUp, handleSignOut } from './auth.js';

export function setupEventListeners() {
    const movieModalOverlay = document.getElementById('movie-modal-overlay');
    const addMovieFloatButton = document.getElementById('add-movie-float-button');
    const movieDetailsModalOverlay = document.getElementById('movie-details-modal-overlay');
    const closeDetailModalButton = document.getElementById('close-detail-modal-button');
    const movieTitleInput = document.getElementById('movie-title-input');
    const movieCommentInput = document.getElementById('movie-comment-input');
    const enhanceCommentButton = document.getElementById('enhance-comment-button');
    const tmdbSearchResultsDiv = document.getElementById('tmdb-search-results');
    const tmdbSearchMessage = document.getElementById('tmdb-search-message');
    let tmdbSearchTimeout;
    const movieDateInput = document.getElementById('movie-date-input');
    const movieRatingInputDiv = document.getElementById('movie-rating-input');
    const watchLaterCheckbox = document.getElementById('watch-later-checkbox');
    const cancelButton = document.getElementById('cancel-button');
    const signOutButton = document.getElementById('sign-out-button');
    
    const emailAuthForm = document.getElementById('email-auth-form');
    const authTabLogin = document.getElementById('auth-tab-login');
    const authTabSignup = document.getElementById('auth-tab-signup');
    const authSubmitButton = document.getElementById('auth-submit-button');
    const authErrorMessage = document.getElementById('auth-error-message');
    const authEmailInput = document.getElementById('auth-email');
    const authEmailError = document.getElementById('auth-email-error');
    const authPasswordInput = document.getElementById('auth-password');
    const authPasswordToggle = document.getElementById('auth-password-toggle');
    const eyeOpenIcon = document.getElementById('eye-open-icon');
    const eyeClosedIcon = document.getElementById('eye-closed-icon');

    // Navigation
    document.getElementById('nav-my-log').addEventListener('click', (e) => { e.preventDefault(); showSection('my-watched-movies-section'); });
    document.getElementById('nav-trending').addEventListener('click', (e) => { e.preventDefault(); showSection('trending-movies-section'); });
    document.getElementById('nav-lists').addEventListener('click', (e) => { e.preventDefault(); showSection('special-lists-section'); });
    document.getElementById('nav-watch-later').addEventListener('click', (e) => { e.preventDefault(); showSection('watch-later-movies-section'); });
    document.getElementById('nav-profile').addEventListener('click', (e) => { e.preventDefault(); showSection('profile-section'); });
    
    if (signOutButton) signOutButton.addEventListener('click', handleSignOut);
    if (addMovieFloatButton) addMovieFloatButton.addEventListener('click', (e) => { e.preventDefault(); openMovieMode(); });

    // Modals
    cancelButton.addEventListener('click', () => closeMovieMode(movieModalOverlay));
    movieModalOverlay.addEventListener('click', (e) => { if (e.target === movieModalOverlay) closeMovieMode(movieModalOverlay); });
    
    if (closeDetailModalButton) {
        closeDetailModalButton.addEventListener('click', () => closeMovieDetailsModal());
    }
    if (movieDetailsModalOverlay) {
        movieDetailsModalOverlay.addEventListener('click', (e) => { 
            if (e.target === movieDetailsModalOverlay) {
                closeMovieDetailsModal();
            }
        });
    }
    
    authEmailInput.addEventListener('input', () => {
        const email = authEmailInput.value;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (emailRegex.test(email) || email === '') {
            authEmailError.classList.add('hidden');
            authEmailInput.parentElement.classList.remove('invalid');
        } else {
            authEmailError.classList.remove('hidden');
            authEmailInput.parentElement.classList.add('invalid');
        }
    });

    authPasswordToggle.addEventListener('click', () => {
        const isPassword = authPasswordInput.type === 'password';
        authPasswordInput.type = isPassword ? 'text' : 'password';
        eyeOpenIcon.classList.toggle('hidden', isPassword);
        eyeClosedIcon.classList.toggle('hidden', !isPassword);
    });

    if (emailAuthForm) {
        authTabLogin.addEventListener('click', () => {
            authTabLogin.classList.add('active');
            authTabSignup.classList.remove('active');
            authSubmitButton.textContent = 'Giriş Yap';
            authErrorMessage.classList.add('hidden');
        });

        authTabSignup.addEventListener('click', () => {
            authTabSignup.classList.add('active');
            authTabLogin.classList.remove('active');
            authSubmitButton.textContent = 'Kayıt Ol';
            authErrorMessage.classList.add('hidden');
        });

        emailAuthForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = authEmailInput.value;
            const password = authPasswordInput.value;
            const isLogin = authTabLogin.classList.contains('active');
            authErrorMessage.classList.add('hidden');
            authSubmitButton.disabled = true;

            try {
                if (isLogin) {
                    await handleSignIn(email, password);
                    showNotification('Başarıyla giriş yapıldı!', 'success');
                } else {
                    await handleSignUp(email, password);
                    await handleSignOut(); 
                    showNotification('Hesabınız oluşturuldu, lütfen giriş yapınız.', 'info', 6000);
                    authTabLogin.classList.add('active');
                    authTabSignup.classList.remove('active');
                    authSubmitButton.textContent = 'Giriş Yap';
                    emailAuthForm.reset();
                }
            } catch (error) {
                console.error("Authentication Error:", error);
                authErrorMessage.textContent = getFriendlyAuthError(error);
                authErrorMessage.classList.remove('hidden');
            } finally {
                authSubmitButton.disabled = false;
            }
        });
    }

    function getFriendlyAuthError(error) {
        switch (error.code) {
            case 'auth/invalid-email': return 'Lütfen geçerli bir e-posta adresi girin.';
            case 'auth/user-not-found':
            case 'auth/wrong-password':
            case 'auth/invalid-credential': return 'E-posta veya parola hatalı. Lütfen kontrol edin.';
            case 'auth/email-already-in-use': return 'Bu e-posta adresi zaten başka bir hesap tarafından kullanılıyor.';
            case 'auth/weak-password': return 'Parolanız en az 6 karakter uzunluğunda olmalıdır.';
            default: return 'Bir hata oluştu. Lütfen daha sonra tekrar deneyin.';
        }
    }

    watchLaterCheckbox.addEventListener('change', () => {
        const ratingGroup = movieRatingInputDiv.parentElement;
        const watchedDateGroup = document.getElementById('watched-date-group');
        const chatWithCharacterButton = document.getElementById('chat-with-character-button');
        const hasTmdbId = !!document.getElementById('movie-tmdb-id').value;

        if (watchLaterCheckbox.checked) {
            movieDateInput.disabled = true;
            movieDateInput.required = false;
            watchedDateGroup.style.display = 'none';
            ratingGroup.style.display = 'none';
            movieRatingInputDiv.innerHTML = '';
            enhanceCommentButton.style.display = 'none';
            chatWithCharacterButton.classList.add('hidden'); // DÜZELTME
        } else {
            movieDateInput.disabled = false;
            movieDateInput.required = true;
            watchedDateGroup.style.display = 'block';
            ratingGroup.style.display = 'block';
            setupStarRating(movieRatingInputDiv, 0);
            enhanceCommentButton.style.display = 'block';
            if (hasTmdbId) { // DÜZELTME
                chatWithCharacterButton.classList.remove('hidden');
            }
        }
    });

    movieTitleInput.addEventListener('input', () => {
        if (movieTitleInput.readOnly) return;
        clearTimeout(tmdbSearchTimeout);
        tmdbSearchTimeout = setTimeout(() => {
            searchTmdbMovies(movieTitleInput.value, tmdbSearchResultsDiv, tmdbSearchMessage, displayTmdbSearchResults);
        }, 300);
    });
    
    enhanceCommentButton.addEventListener('click', async () => {
        const currentComment = movieCommentInput.value.trim();
        if (currentComment.length < 10) {
            showNotification('Lütfen yorumunuzu geliştirmek için en az 10 karakter girin.', 'error');
            return;
        }
        await enhanceCommentWithGemini(currentComment, movieTitleInput.value, movieCommentInput, enhanceCommentButton);
    });
>>>>>>> 0774527a2897dff5e06e515d8b1bb027ffd7a00e
}