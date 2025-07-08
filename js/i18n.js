// js/i18n.js

// O anki dilin çevirilerini ve kodunu saklamak için değişkenler
let translations = {};
let currentLang = 'tr';

/**
 * Verilen dil koduna göre çevirileri yükler ve arayüzü günceller.
 * @param {string} lang - Yüklenecek dil kodu ('tr', 'en' vb.).
 */
export async function setLanguage(lang) {
  try {
    const response = await fetch(`/locales/${lang}.json`);
    if (!response.ok) {
      throw new Error('Dil dosyası yüklenemedi.');
    }
    translations = await response.json();
    currentLang = lang;

    applyTranslations();

    // Kullanıcının tercihini sonraki ziyaretleri için kaydet
    localStorage.setItem('preferredLanguage', lang);
    console.log(`Dil ${lang} olarak ayarlandı.`);

    // === YENİ EKLENEN SİNYAL ===
    // Dil başarıyla değiştiğinde, uygulamanın geri kalanına haber ver.
    document.dispatchEvent(new CustomEvent('language-changed'));
    // =============================

  } catch (error) {
    console.error(`Dil yüklenirken hata oluştu: ${lang}`, error);
    // Hata durumunda varsayılan olarak Türkçe'ye dön
    if (lang !== 'tr') {
      await setLanguage('tr');
    }
  }
}

/**
 * Yüklenmiş olan çevirileri HTML'e uygular.
 */
function applyTranslations() {
  // Metinleri değiştir (Örn: <span>Metin</span>)
  document.querySelectorAll('[data-i18n]').forEach(element => {
    const key = element.dataset.i18n;
    if (translations[key]) {
      // Elementin içindeki diğer elementleri (ikon gibi) korumak için
      // sadece ilk text node'u güncelliyoruz.
      const firstChild = element.firstChild;
      if (firstChild && firstChild.nodeType === Node.TEXT_NODE) {
        firstChild.nodeValue = translations[key];
      } else {
        element.textContent = translations[key];
      }
    }
  });

  // Placeholder'ları değiştir (Örn: <textarea placeholder="...">)
  document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
    const key = element.dataset.i18nPlaceholder;
    if (translations[key]) {
      element.placeholder = translations[key];
    }
  });
}

/**
 * Diğer JS dosyalarının çeviri metinlerine erişmesi için bir yardımcı fonksiyon.
 * @param {string} key - Çeviri anahtarı.
 * @returns {string} Çevrilmiş metin veya anahtarın kendisi.
 */
export function getTranslation(key) {
    return translations[key] || key;
}

/**
 * O anki aktif dilin kodunu döndürür ('tr' veya 'en').
 * @returns {string}
 */
export function getCurrentLang() {
    return currentLang;
}

/**
 * Uygulama ilk açıldığında çalışacak ana dil fonksiyonu.
 * Kayıtlı tercihe veya tarayıcı diline göre doğru dili seçer.
 */
export function initializeI18n() {
  const preferredLang = localStorage.getItem('preferredLanguage');
  const browserLang = navigator.language.split('-')[0]; // 'tr-TR' -> 'tr'

  // Eğer kayıtlı bir dil varsa onu kullan, yoksa tarayıcı dilini kontrol et,
  // o da desteklenmiyorsa varsayılan olarak Türkçe'yi kullan.
  const langToLoad = preferredLang || (['en', 'tr'].includes(browserLang) ? browserLang : 'tr');

  setLanguage(langToLoad);
}