// js/theme.js

const themeToggle = document.getElementById('theme-toggle');
const body = document.body;
const themeStatus = document.getElementById('theme-status');

/**
 * Uygulamanın temasını ayarlar ve localStorage'a kaydeder.
 * @param {string} theme - 'light' veya 'dark'.
 */
function setTheme(theme) {
  body.classList.toggle('light-theme', theme === 'light');
  body.classList.toggle('dark-theme', theme === 'dark');
  localStorage.setItem('preferredTheme', theme);
  updateThemeStatusText(theme);
}

/**
 * Tema durum metnini günceller (Açık/Koyu).
 * @param {string} theme - 'light' veya 'dark'.
 */
function updateThemeStatusText(theme) {
  themeStatus.textContent = theme === 'light' ? getTranslation('theme_light') : getTranslation('theme_dark');
}

/**
 * Kullanıcının localStorage'daki tercihine göre temayı yükler veya varsayılanı ayarlar.
 */
export function initializeTheme() {
  const preferredTheme = localStorage.getItem('preferredTheme');

  if (preferredTheme) {
    setTheme(preferredTheme);
    themeToggle.checked = preferredTheme === 'light';
  } else {
    // Varsayılan olarak koyu temayı ayarla (veya isterseniz açık yapabilirsiniz)
    setTheme('dark');
    themeToggle.checked = false;
  }

  themeToggle.addEventListener('change', () => {
    setTheme(themeToggle.checked ? 'light' : 'dark');
  });
}

// Çeviri fonksiyonunu import etmeyi unutmayın
import { getTranslation } from './i18n.js';