import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { db, auth } from './firebase.js';
import { doc, getDoc, writeBatch } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { updateProfile } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getTranslation } from './i18n.js';
import { showNotification } from './utils.js';
import { isUsernameTaken } from './user.js'; // Yeni casusumuzu import ettik

// --- DOM Elementleri ---
const profileSetupModal = document.getElementById('profile-setup-modal');
const avatarPreviewWrapper = document.getElementById('avatar-preview-wrapper');
const avatarPreview = document.getElementById('avatar-preview');
const profileSetupForm = document.getElementById('profile-setup-form');
const usernameInput = document.getElementById('setup-username-input');
const displayNameInput = document.getElementById('setup-displayname-input');
const usernameStatusText = document.getElementById('username-availability-status');
const completeProfileBtn = document.getElementById('complete-profile-btn');

let selectedImageData = null; // Seçilen resmin base64 verisi
let isUsernameValid = false;   // Kullanıcı adının geçerli ve uygun olup olmadığını tutar
let debounceTimer;

// --- Fonksiyonlar ---

/**
 * Kullanıcı yazmayı bıraktıktan sonra bir fonksiyonu çalıştırmak için.
 */
const debounce = (func, delay) => {
  return (...args) => {
usernameStatusText.textContent = getTranslation('username_status_checking');
    usernameStatusText.className = 'input-status-text';
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
};

/**
 * Kullanıcı adının geçerli ve uygun olup olmadığını kontrol eder, arayüzü günceller.
 */
const checkUsernameAvailability = async () => {
  const username = usernameInput.value.trim().toLowerCase();

  // Kural 1: Uzunluk kontrolü
  if (username.length < 3) {
    usernameStatusText.textContent = getTranslation('username_status_too_short');
    usernameStatusText.className = 'input-status-text taken';
    isUsernameValid = false;
    completeProfileBtn.disabled = true;
    return;
  }

  // Kural 2: Geçerli karakter kontrolü
  if (!/^[a-z0-9_.]+$/.test(username)) {
    usernameStatusText.textContent = getTranslation('username_status_invalid_chars');
    usernameStatusText.className = 'input-status-text taken';
    isUsernameValid = false;
    completeProfileBtn.disabled = true;
    return;
  }

  // Kural 3: Veritabanından kontrol
  try {
    const isTaken = await isUsernameTaken(username);
    if (isTaken) {
      usernameStatusText.textContent = getTranslation('username_status_taken');
      usernameStatusText.className = 'input-status-text taken';
      isUsernameValid = false;
    } else {
      usernameStatusText.textContent = getTranslation('username_status_available');
      usernameStatusText.className = 'input-status-text available';
      isUsernameValid = true;
    }
  } catch (error) {
    console.error("Kullanıcı adı kontrol hatası:", error);
    usernameStatusText.textContent = getTranslation('username_status_error');
    usernameStatusText.className = 'input-status-text taken';
    isUsernameValid = false;
  } finally {
    completeProfileBtn.disabled = !isUsernameValid;
  }
};

/**
 * Kullanıcıya fotoğraf seçme menüsünü gösterir.
 */
const selectAvatar = async () => {
  try {
    const image = await Camera.getPhoto({
      quality: 90,
      allowEditing: true,
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Prompt,
      promptLabelHeader: getTranslation("avatar_select_title"),
      promptLabelPhoto: getTranslation("avatar_select_gallery"),
      promptLabelPicture: getTranslation("avatar_select_camera")
    });
    if (image && image.dataUrl) {
      avatarPreview.src = image.dataUrl;
      selectedImageData = image.dataUrl;
    }
  } catch (error) {
    console.error('Kamera hatası:', error);
  }
};

/**
 * Profil oluşturma formunun gönderilmesini yönetir (ŞİMDİLİK BOŞ).
 */
const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!isUsernameValid) return;
    
    // BİR SONRAKİ ADIMDA BU FONKSİYONUN İÇİNİ DOLDURACAĞIZ
    console.log("Form gönderilmeye hazır!");
    console.log("Kullanıcı Adı:", usernameInput.value);
    console.log("Görünen İsim:", displayNameInput.value);
    console.log("Avatar Verisi Var Mı?:", !!selectedImageData);
};

/**
 * Profil oluşturma ekranını ve olaylarını başlatır.
 */
export function initProfileSetup() {
  if (!profileSetupForm) return;

  avatarPreviewWrapper.addEventListener('click', selectAvatar);
  usernameInput.addEventListener('input', debounce(checkUsernameAvailability, 500)); // 500ms gecikmeli kontrol
  profileSetupForm.addEventListener('submit', handleProfileSubmit);
}

/**
 * Profil oluşturma penceresini gösterir.
 */
export function showProfileSetupModal() {
    if (!profileSetupModal) return;
    profileSetupModal.classList.remove('hidden');
    setTimeout(() => {
        profileSetupModal.classList.add('visible');
    }, 10);
}