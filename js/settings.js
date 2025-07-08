// js/settings.js
import { setLanguage, getCurrentLang } from './i18n.js';

// Menümüzle ilgili HTML elemanlarını en başta tanımlıyoruz
let settingsOverlay, settingsPanel, settingsIconBtn, settingsCloseBtn, langTrBtn, langEnBtn;

/**
 * Ayarlar menüsünü başlatır, elemanları bulur ve olay dinleyicilerini ekler.
 * Bu fonksiyon, uygulama ilk açıldığında bir kez çağrılacak.
 */
export function initSettingsMenu() {
    // HTML'deki elemanları ID'lerine göre bulup değişkenlere atıyoruz
    settingsOverlay = document.getElementById('settings-overlay');
    settingsPanel = document.getElementById('settings-panel');
    settingsIconBtn = document.getElementById('settings-icon-btn');
    settingsCloseBtn = document.getElementById('settings-close-btn');
    langTrBtn = document.getElementById('lang-tr-btn');
    langEnBtn = document.getElementById('lang-en-btn');

    // Eğer bu elemanlardan biri bulunamazsa, hata ver ve devam etme
    if (!settingsOverlay || !settingsIconBtn || !settingsCloseBtn || !langTrBtn || !langEnBtn) {
        console.error('Ayarlar menüsü için gerekli HTML elemanları bulunamadı.');
        return;
    }

    // --- OLAY DİNLEYİCİLERİNİ EKLİYORUZ ---

    // Dişli çark ikonuna tıklandığında menüyü aç
    settingsIconBtn.addEventListener('click', openSettingsMenu);

    // Panelin dışındaki siyah alana tıklandığında menüyü kapat
    settingsOverlay.addEventListener('click', (event) => {
        if (event.target === settingsOverlay) {
            closeSettingsMenu();
        }
    });

    // "Kapat" butonuna tıklandığında menüyü kapat
    settingsCloseBtn.addEventListener('click', closeSettingsMenu);

    // Türkçe dil butonuna tıklandığında...
    langTrBtn.addEventListener('click', () => handleLanguageSelect('tr'));

    // İngilizce dil butonuna tıklandığında...
    langEnBtn.addEventListener('click', () => handleLanguageSelect('en'));
}

/**
 * Ayarlar menüsünü açar.
 */
function openSettingsMenu() {
    // Menü açılmadan önce, mevcut dile göre doğru butonun seçili olduğundan emin ol
    const currentLang = getCurrentLang();
    if (currentLang === 'tr') {
        langTrBtn.classList.add('active');
        langEnBtn.classList.remove('active');
    } else {
        langEnBtn.classList.add('active');
        langTrBtn.classList.remove('active');
    }

    // CSS'in menüyü görünür yapması için 'visible' sınıfını ekle
    settingsOverlay.classList.add('visible');
}

/**
 * Ayarlar menüsünü kapatır.
 */
function closeSettingsMenu() {
    settingsOverlay.classList.remove('visible');
}

/**
 * Bir dil seçildiğinde çalışacak fonksiyon.
 * @param {string} lang - Seçilen dil kodu ('tr' veya 'en')
 */
function handleLanguageSelect(lang) {
    // i18n sihirbazımızdaki setLanguage fonksiyonunu çağırarak tüm dili değiştir
    setLanguage(lang);
    // Menüyü kapat
    closeSettingsMenu();
}