<<<<<<< HEAD
// js/badge-modal.js

// DOM Elementleri
let modalOverlay;
let modalContent;
let badgeIconEl;
let badgeNameEl;
let badgeDescriptionEl;
let closeBtn;

/**
 * Mikro-modal penceresini ve olay dinleyicilerini başlatır.
 * Bu fonksiyon uygulama açılışında bir kez çağrılmalıdır.
 */
export function initBadgeInfoModal() {
    modalOverlay = document.getElementById('badge-info-modal');
    modalContent = modalOverlay?.querySelector('.micro-modal-content');
    badgeIconEl = document.getElementById('badge-info-icon');
    badgeNameEl = document.getElementById('badge-info-name');
    badgeDescriptionEl = document.getElementById('badge-info-description');
    closeBtn = document.getElementById('badge-info-close-btn');

    if (!modalOverlay || !closeBtn) {
        console.error('Rozet bilgi modalı DOM elementleri bulunamadı.');
        return;
    }

    // Kapatma butonuna tıklandığında modalı gizle
    closeBtn.addEventListener('click', hideBadgeInfo);

    // Overlay'a tıklandığında (içerik hariç) modalı gizle
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
            hideBadgeInfo();
        }
    });
}

/**
 * Verilen rozet bilgisiyle modalı doldurur ve gösterir.
 * @param {object} badge - Gösterilecek rozetin nesnesi (id, name, icon, description).
 */
export function showBadgeInfo(badge) {
    if (!badge || !modalOverlay) return;

    badgeIconEl.textContent = badge.icon;
    badgeNameEl.textContent = badge.name;
    badgeDescriptionEl.textContent = badge.description;

    modalOverlay.classList.remove('hidden');
    // Animasyon için küçük bir gecikme
    setTimeout(() => {
        modalOverlay.classList.add('visible');
    }, 10);
}

/**
 * Rozet bilgi modalını gizler.
 */
function hideBadgeInfo() {
    if (!modalOverlay) return;

    modalOverlay.classList.remove('visible');
    // Animasyon bittiğinde display:none yapmak için
    modalOverlay.addEventListener('transitionend', () => {
        if (!modalOverlay.classList.contains('visible')) {
            modalOverlay.classList.add('hidden');
        }
    }, { once: true });
=======
// js/badge-modal.js

// DOM Elementleri
let modalOverlay;
let modalContent;
let badgeIconEl;
let badgeNameEl;
let badgeDescriptionEl;
let closeBtn;

/**
 * Mikro-modal penceresini ve olay dinleyicilerini başlatır.
 * Bu fonksiyon uygulama açılışında bir kez çağrılmalıdır.
 */
export function initBadgeInfoModal() {
    modalOverlay = document.getElementById('badge-info-modal');
    modalContent = modalOverlay?.querySelector('.micro-modal-content');
    badgeIconEl = document.getElementById('badge-info-icon');
    badgeNameEl = document.getElementById('badge-info-name');
    badgeDescriptionEl = document.getElementById('badge-info-description');
    closeBtn = document.getElementById('badge-info-close-btn');

    if (!modalOverlay || !closeBtn) {
        console.error('Rozet bilgi modalı DOM elementleri bulunamadı.');
        return;
    }

    // Kapatma butonuna tıklandığında modalı gizle
    closeBtn.addEventListener('click', hideBadgeInfo);

    // Overlay'a tıklandığında (içerik hariç) modalı gizle
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
            hideBadgeInfo();
        }
    });
}

/**
 * Verilen rozet bilgisiyle modalı doldurur ve gösterir.
 * @param {object} badge - Gösterilecek rozetin nesnesi (id, name, icon, description).
 */
export function showBadgeInfo(badge) {
    if (!badge || !modalOverlay) return;

    badgeIconEl.textContent = badge.icon;
    badgeNameEl.textContent = badge.name;
    badgeDescriptionEl.textContent = badge.description;

    modalOverlay.classList.remove('hidden');
    // Animasyon için küçük bir gecikme
    setTimeout(() => {
        modalOverlay.classList.add('visible');
    }, 10);
}

/**
 * Rozet bilgi modalını gizler.
 */
function hideBadgeInfo() {
    if (!modalOverlay) return;

    modalOverlay.classList.remove('visible');
    // Animasyon bittiğinde display:none yapmak için
    modalOverlay.addEventListener('transitionend', () => {
        if (!modalOverlay.classList.contains('visible')) {
            modalOverlay.classList.add('hidden');
        }
    }, { once: true });
>>>>>>> 0774527a2897dff5e06e515d8b1bb027ffd7a00e
}