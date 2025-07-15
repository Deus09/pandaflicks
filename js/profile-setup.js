import { db, auth } from './firebase.js';
import { doc, getDoc, writeBatch } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { updateProfile } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getTranslation } from './i18n.js';
import { showNotification } from './utils.js';
import { isUsernameTaken } from './user.js';
import { updateProfileView } from './sections.js';
import { onModalOpen, onModalClose } from './scroll-lock.js';

// --- HTML Elementlerini Seçelim ---
const profileSetupModal = document.getElementById('profile-setup-modal');
const avatarPreviewWrapper = document.getElementById('avatar-preview-wrapper');
const avatarPreview = document.getElementById('avatar-preview');
const profileSetupForm = document.getElementById('profile-setup-form');
const usernameInput = document.getElementById('setup-username-input');
const displayNameInput = document.getElementById('setup-displayname-input');
const usernameStatusText = document.getElementById('username-availability-status');
const completeProfileBtn = document.getElementById('complete-profile-btn');

// --- Değişkenler ---
let isUsernameValid = false;
let debounceTimer;

// --- Fonksiyonlar ---

/**
 * Kullanıcı yazmayı bıraktığında fonksiyonu çalıştırmak için bir yardımcı.
 * Veritabanını sürekli sorgulamamak için kullanılır.
 */
const debounce = (func, delay) => {
  return (...args) => {
    usernameStatusText.textContent = getTranslation('username_status_checking');
    usernameStatusText.className = 'input-status-text'; // Rengi sıfırla
    isUsernameValid = false; // Kontrol başlarken butonu kilitle
    completeProfileBtn.disabled = true;
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
};

/**
 * Girilen kullanıcı adının kurallara uygun ve benzersiz olup olmadığını kontrol eder.
 */
const checkUsernameAvailability = async () => {
  const username = usernameInput.value.trim().toLowerCase();
  
  if (username.length < 3) {
    usernameStatusText.textContent = getTranslation('username_status_too_short');
    usernameStatusText.className = 'input-status-text taken';
    isUsernameValid = false;
    completeProfileBtn.disabled = true;
    return;
  }
  
  // Sadece küçük harf, rakam ve alt çizgiye izin ver
  if (!/^[a-z0-9_]+$/.test(username)) {
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
    // Sadece kullanıcı adı geçerliyse butonu aktif et
    completeProfileBtn.disabled = !isUsernameValid;
  }
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
    completeProfileBtn.textContent = '...';

    try {
        const batch = writeBatch(db);
        
        // 1. Kullanıcının ana belgesini güncelle
        const userDocRef = doc(db, "users", user.uid);
        batch.set(userDocRef, { 
            username: username, 
            displayName: displayName,
            isProfileComplete: true // En önemlisi: Profili tamamlandı olarak işaretle!
        }, { merge: true });

        // 2. Kullanıcı adını rezerve et
        const usernameDocRef = doc(db, "usernames", username);
        batch.set(usernameDocRef, { uid: user.uid });
        
        // Bu iki işlemi aynı anda yap
        await batch.commit();

        // Firebase Auth profilini de güncelle (görünen isim için)
        await updateProfile(user, { displayName: displayName });

        showNotification('Profilin başarıyla oluşturuldu!', 'success');
        
        updateProfileView(auth.currentUser); // Profil sayfasını anında güncelle
        hideProfileSetupModal(); // Pencereyi kapat

    } catch (error) {
        console.error("Profil kaydedilirken hata:", error);
        showNotification('Profil oluşturulurken bir hata oluştu.', 'error');
    } finally {
        completeProfileBtn.disabled = false;
        completeProfileBtn.textContent = getTranslation("profile_setup_complete_button");
    }
};


/**
 * Bu modülün olay dinleyicilerini başlatan ana fonksiyon.
 */
export function initProfileSetup() {
  if (!profileSetupForm) return;
  // Avatar seçimine şimdilik bir fonksiyon atamıyoruz, gelecekte eklenecek.
  // avatarPreviewWrapper.addEventListener('click', selectAvatar);
  usernameInput.addEventListener('input', debounce(checkUsernameAvailability, 500));
  profileSetupForm.addEventListener('submit', handleProfileSubmit);
}

/**
 * Profil oluşturma penceresini gösterir.
 */
export function showProfileSetupModal() {
    if (!profileSetupModal) return;
    onModalOpen(); // Scroll kilidini devreye sok
    profileSetupModal.classList.remove('hidden');
    setTimeout(() => {
        profileSetupModal.classList.add('visible');
    }, 10);
}

/**
 * Profil oluşturma penceresini gizler.
 */
function hideProfileSetupModal() {
  if (!profileSetupModal) return;
  onModalClose(); // Scroll kilidini aç
  profileSetupModal.classList.remove('visible');
  profileSetupModal.addEventListener('transitionend', () => {
    if (!profileSetupModal.classList.contains('visible')) {
      profileSetupModal.classList.add('hidden');
    }
  }, { once: true });
}