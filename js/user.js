// js/user.js
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "./firebase.js";

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
    if (!userId) {
        // Kullanıcı yoksa veya anonim ise varsayılan olarak Pro değil.
        currentUserStatus = { isPro: false, plan: null, endDate: null };
        return;
    }

    const userDocRef = doc(db, "users", userId);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists() && userDocSnap.data().subscription) {
        const subData = userDocSnap.data().subscription;
        
        // Abonelik bitiş tarihini kontrol et. Eğer geçmişteyse, Pro değil.
        const isSubscriptionActive = subData.endDate && new Date(subData.endDate.toMillis()) > new Date();

        if (subData.isPro && isSubscriptionActive) {
            currentUserStatus = {
                isPro: true,
                plan: subData.plan || null,
                endDate: subData.endDate.toDate()
            };
        } else {
            // Aboneliği var ama süresi dolmuş.
            currentUserStatus = { isPro: false, plan: null, endDate: null };
        }
    } else {
        // Kullanıcının abonelik bilgisi hiç yok.
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