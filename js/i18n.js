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
    console.log("Sözlük başarıyla yüklendi. İçinde 'list_top_rated_all_time_name' anahtarı var mı?", translations.hasOwnProperty('list_top_rated_all_time_name'));
    console.log("Yüklenen sözlüğün içeriği:", translations);
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
  // Metinleri değiştir
  document.querySelectorAll('[data-i18n]').forEach(element => {
    const key = element.dataset.i18n;
    const translation = translations[key];
    if (translation) {
      // Eğer çeviri metni içinde '<' ve '>' karakterleri varsa, bunu HTML olarak kabul et.
      if (translation.includes('<') && translation.includes('>')) {
        element.innerHTML = translation;
      } else {
        // Yoksa, güvenli olan textContent kullanmaya devam et.
        element.textContent = translation;
      }
    }
  });

  // Placeholder'ları değiştir
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
export async function initializeI18n() { // Fonksiyonu async yaptık
  const preferredLang = localStorage.getItem('preferredLanguage');
  const browserLang = navigator.language.split('-')[0]; // 'tr-TR' -> 'tr'

  const langToLoad = preferredLang || (['en', 'tr'].includes(browserLang) ? browserLang : 'tr');

  await setLanguage(langToLoad); // Dil yüklemesinin bitmesini bekle
}