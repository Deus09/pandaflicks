// js/paywall.js

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
        // BU BÖLÜM BİR SONRAKİ ADIMDA GERÇEK ÖDEME KODLARIYLA DEĞİŞECEK
        console.log(`Satın alma işlemi başlatıldı: ${selectedPlan}`);
        alert(`"${selectedPlan}" planı için satın alma işlemi başlatılıyor... (Bu henüz gerçek bir ödeme değil)`);
        
        // Örn: initiatePurchase(selectedPlan);
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