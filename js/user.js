// js/user.js
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "./firebase.js";

// YENİ: Admin olarak tanımlamak istediğiniz kullanıcıların UID'lerini bu listeye ekleyin.
// 1. Adımda bulduğunuz kendi UID'nizi tırnak işaretlerinin arasına yapıştırın.
const ADMIN_UIDS = ['510WsOiCBmdTYStLx14ZBvaikro1'];

// Uygulama içinde kullanıcının Pro durumunu hızlıca kontrol etmek için
// yerel bir değişken tutacağız.
let currentUserStatus = {
    isPro: false,
    plan: null,
    endDate: null
};

/**
 * Firestore'dan mevcut kullanıcının abonelik durumunu çeker ve günceller.
 * @param {string} userId - Mevcut giriş yapmış kullanıcının ID'si.
 */
export async function fetchUserSubscriptionStatus(userId) {
    // YENİ: ADMIN KONTROLÜ
    // Fonksiyonun en başında, gelen userId'nin admin listesinde olup olmadığını kontrol et.
    if (userId && ADMIN_UIDS.includes(userId)) {
        console.log("👑 Admin kullanıcı algılandı. Tüm özellikler açılıyor.");
        currentUserStatus = {
            isPro: true,
            plan: 'admin', // Planı 'admin' olarak belirtelim
            endDate: null   // Adminlerin süresi dolmaz
        };
        // Admin ise Firestore'a hiç sormadan işlemi burada bitir.
        return; 
    }

    // --- Buradan sonrası normal kullanıcılar için çalışmaya devam eder ---

    if (!userId) {
        // Kullanıcı yoksa veya anonim ise varsayılan olarak Pro değil.
        currentUserStatus = { isPro: false, plan: null, endDate: null };
        return;
    }

    const userDocRef = doc(db, "users", userId);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists() && userDocSnap.data().subscription) {
        const subData = userDocSnap.data().subscription;
        
        const isSubscriptionActive = subData.endDate && new Date(subData.endDate.toMillis()) > new Date();

        if (subData.isPro && isSubscriptionActive) {
            currentUserStatus = {
                isPro: true,
                plan: subData.plan || null,
                endDate: subData.endDate.toDate()
            };
        } else {
            currentUserStatus = { isPro: false, plan: null, endDate: null };
        }
    } else {
        currentUserStatus = { isPro: false, plan: null, endDate: null };
    }
    
    console.log("User subscription status updated:", currentUserStatus);
}

/**
 * Mevcut kullanıcının Pro olup olmadığını anında döndüren fonksiyon.
 * @returns {boolean}
 */
export function isUserPro() {
    return currentUserStatus.isPro;
}

/**
 * Kullanıcının abonelik durumu kontrol edildikten sonra
 * arayüzdeki Pro özellikleri kilitler veya açar.
 */
export function updateUIForSubscriptionStatus() {
    const proFeatures = document.querySelectorAll('.pro-feature');
    const isPro = isUserPro();

    proFeatures.forEach(featureElement => {
        if (isPro) {
            // Kullanıcı Pro ise, kilit sınıfını kaldır.
            featureElement.classList.remove('feature-locked');
        } else {
            // Kullanıcı Pro değilse, kilit sınıfını ekle.
            featureElement.classList.add('feature-locked');
        }
    });
}

/**
 * Verilen bir kullanıcı adının "usernames" koleksiyonunda olup olmadığını kontrol eder.
 * @param {string} username - Kontrol edilecek kullanıcı adı.
 * @returns {Promise<boolean>} - Kullanıcı adı alınmışsa true, değilse false döner.
 */
export async function isUsernameTaken(username) {
    const usernameDocRef = doc(db, "usernames", username);
    const docSnap = await getDoc(usernameDocRef);
    return docSnap.exists();
}

/**
 * Bir kullanıcının profilinin oluşturulup oluşturulmadığını kontrol eder.
 * @param {string} uid - Kontrol edilecek kullanıcının UID'si.
 * @returns {Promise<boolean>} - Profil tamamlanmışsa true, değilse false döner.
 */
export async function isUserProfileComplete(uid) {
  if (!uid) return false;
  const userDocRef = doc(db, "users", uid);
  const docSnap = await getDoc(userDocRef);
  // Belge var mı VE içinde 'username' alanı var mı?
  return docSnap.exists() && docSnap.data().username;
}