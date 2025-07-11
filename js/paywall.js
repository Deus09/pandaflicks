// js/paywall.js
import { auth } from './firebase.js';
import { showNotification } from './utils.js';
import { getTranslation } from './i18n.js';

let paywallOverlay;
let closePaywallBtn;
let planSelector;
let upgradeToProBtn;

let selectedPlan = 'yearly'; // Varsayılan olarak yıllık plan seçili olsun

/**
 * Paywall ekranını başlatır, elementleri bulur ve olay dinleyicilerini ayarlar.
 */
export function initPaywall() {
    paywallOverlay = document.getElementById('paywall-overlay');
    if (!paywallOverlay) return;

    closePaywallBtn = document.getElementById('close-paywall-btn');
    planSelector = document.getElementById('plan-selector');
    upgradeToProBtn = document.getElementById('upgrade-to-pro-btn');

    closePaywallBtn.addEventListener('click', hidePaywall);
    paywallOverlay.addEventListener('click', (e) => {
        if (e.target === paywallOverlay) {
            hidePaywall();
        }
    });

    planSelector.addEventListener('click', (e) => {
        const selectedOption = e.target.closest('.plan-option');
        if (!selectedOption) return;

        // Tüm seçeneklerden 'recommended' sınıfını kaldır
        planSelector.querySelectorAll('.plan-option').forEach(opt => opt.classList.remove('recommended'));

        // Sadece tıklanana ekle
        selectedOption.classList.add('recommended');
        selectedPlan = selectedOption.dataset.plan;
        console.log(`Selected plan: ${selectedPlan}`);
    });

    upgradeToProBtn.addEventListener('click', () => {
        const user = auth.currentUser;

        // Kullanıcı var mı ve e-postası doğrulanmış mı diye kontrol et
        if (user && user.emailVerified) {
            // --- E-POSTA DOĞRULANMIŞSA (Her şey yolunda) ---
            console.log(`Ödeme işlemi başlatılıyor: ${selectedPlan}`);
            alert(`"${selectedPlan}" planı için ödeme sayfasına yönlendiriliyorsunuz...`);
            // initiatePurchase(selectedPlan); // Gerçek ödeme kodu gelecekte buraya gelecek
        
        } else if (user && !user.emailVerified) {
            // --- E-POSTA DOĞRULANMAMIŞSA (Ödemeyi durdur ve uyar) ---
            showNotification(getTranslation('notification_verify_to_purchase'), 'error');
            // Kullanıcıyı bilgilendirdikten sonra ödeme ekranını kapatıyoruz ki
            // profil sayfasına gidip e-postasını doğrulayabilsin.
            hidePaywall();

        } else {
            // Hiç kullanıcı yoksa (bu pek olası değil ama bir güvenlik önlemi)
            showNotification('Lütfen önce giriş yapın.', 'error');
            hidePaywall();
        }
    });
}

/**
 * Paywall ekranını gösterir.
 */
export function showPaywall() {
    if (!paywallOverlay) return;
    paywallOverlay.classList.remove('hidden');
    setTimeout(() => paywallOverlay.classList.add('visible'), 10);
}

/**
 * Paywall ekranını gizler.
 */
function hidePaywall() {
    if (!paywallOverlay) return;
    paywallOverlay.classList.remove('visible');
    paywallOverlay.addEventListener('transitionend', () => {
        if (!paywallOverlay.classList.contains('visible')) {
            paywallOverlay.classList.add('hidden');
        }
    }, { once: true });
}