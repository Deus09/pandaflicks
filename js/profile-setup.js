import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { db, auth } from './firebase.js';
import { doc, getDoc, writeBatch } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { updateProfile } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getTranslation } from './i18n.js';
import { showNotification } from './utils.js';
import { isUsernameTaken } from './user.js';
import { updateProfileView } from './sections.js'; // EKSİK OLAN IMPORT EKLENDİ
import { onModalOpen, onModalClose } from './scroll-lock.js';

// --- DOM Elementleri ---
const profileSetupModal = document.getElementById('profile-setup-modal');
const avatarPreviewWrapper = document.getElementById('avatar-preview-wrapper');
const avatarPreview = document.getElementById('avatar-preview');
const profileSetupForm = document.getElementById('profile-setup-form');
const usernameInput = document.getElementById('setup-username-input');
const displayNameInput = document.getElementById('setup-displayname-input');
const usernameStatusText = document.getElementById('username-availability-status');
const completeProfileBtn = document.getElementById('complete-profile-btn');

let selectedImageData = null;
let isUsernameValid = false;
let debounceTimer;

// --- Fonksiyonlar ---

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

const checkUsernameAvailability = async () => {
  const username = usernameInput.value.trim().toLowerCase();
  
  if (username.length < 3) {
    usernameStatusText.textContent = getTranslation('username_status_too_short');
    usernameStatusText.className = 'input-status-text taken';
    isUsernameValid = false;
    completeProfileBtn.disabled = true;
    return;
  }
  
  if (!/^[a-z0-9_.]+$/.test(username)) {
    usernameStatusText.textContent = getTranslation('username_status_invalid_chars');
    usernameStatusText.className = 'input-status-text taken';
    isUsernameValid = false;
    completeProfileBtn.disabled = true;
    return;
  }
  
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

const selectAvatar = async () => {
  // Bu fonksiyon mobil için hazır, şimdilik boş bırakıyoruz.
};

/**
 * Profil oluşturma formunun gönderilmesini yönetir.
 */
const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!isUsernameValid) return;

    const user = auth.currentUser;
    if (!user) {
        showNotification('Önce giriş yapmalısınız.', 'error');
        return;
    }

    const username = usernameInput.value.trim().toLowerCase();
    const displayName = displayNameInput.value.trim() || username;

    completeProfileBtn.disabled = true;
    completeProfileBtn.innerHTML = `<span class="loading-spinner" style="display: block;"></span>`;

    try {
        const batch = writeBatch(db);
        const userDocRef = doc(db, "users", user.uid);
        batch.set(userDocRef, { 
            username: username, 
            displayName: displayName,
            createdAt: new Date()
        }, { merge: true });

        const usernameDocRef = doc(db, "usernames", username);
        batch.set(usernameDocRef, { uid: user.uid });
        
        await updateProfile(user, { displayName: displayName });
        await batch.commit();

        showNotification('Profilin başarıyla oluşturuldu!', 'success');
        
        // Profil sayfasındaki ismi anında güncelle
        updateProfileView(auth.currentUser);

        hideProfileSetupModal(); // Yeni ve doğru kapatma fonksiyonunu çağır

    } catch (error) {
        console.error("Profil kaydedilirken hata:", error);
        showNotification('Profil oluşturulurken bir hata oluştu.', 'error');
        completeProfileBtn.disabled = false;
        completeProfileBtn.innerHTML = getTranslation("profile_setup_complete_button");
    }
};

export function initProfileSetup() {
  if (!profileSetupForm) return;
  avatarPreviewWrapper.addEventListener('click', selectAvatar);
  usernameInput.addEventListener('input', debounce(checkUsernameAvailability, 500));
  profileSetupForm.addEventListener('submit', handleProfileSubmit);
}

export function showProfileSetupModal() {
    if (!profileSetupModal) return;
    onModalOpen(); // SCROLL KİLİDİNİ ÇALIŞTIR
    profileSetupModal.classList.remove('hidden');
    setTimeout(() => {
        profileSetupModal.classList.add('visible');
    }, 10);
}

/**
 * Profil oluşturma penceresini gizler ve scroll kilidini açar.
 */
function hideProfileSetupModal() {
  if (!profileSetupModal) return;
  onModalClose(); // SCROLL KİLİDİNİ AÇ
  profileSetupModal.classList.remove('visible');
  profileSetupModal.addEventListener('transitionend', () => {
    if (!profileSetupModal.classList.contains('visible')) {
      profileSetupModal.classList.add('hidden');
    }
  }, { once: true });
}