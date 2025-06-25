// js/utils.js
console.log('utils.js yüklendi.'); // Konsol mesajı eklendi

export const STAR_SVG_PATH = "M12 .587l3.668 7.568 8.332 1.151-6.064 5.828 1.48 8.279-7.416-3.921-7.417 3.921 1.481-8.279-6.064-5.828 8.332-1.151z";
export const HALF_STAR_GRADIENT_ID = "halfStarGradient";

/**
 * Tarih dizesini okunabilir bir formata dönüştürür.
 * Eğer tarih bugün veya dün ise özel ifadeler kullanır.
 * @param {string} dateString -YYYY-MM-DD formatında tarih dizesi.
 * @returns {string} Formatlanmış tarih dizesi.
 */
export function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
        return 'Bugün izlendi';
    } else if (date.toDateString() === yesterday.toDateString()) {
        return 'Dün izlendi';
    } else {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return date.toLocaleDateString('tr-TR', options) + ' tarihinde izlendi';
    }
}

/**
 * Ekranda bir bildirim mesajı oluşturur ve gösterir. (Yeni Fonksiyon)
 * @param {string} message Gösterilecek mesaj.
 * @param {string} type Bildirim türü ('success', 'error', 'info').
 * @param {number} duration Bildirimin görünür kalacağı milisaniye cinsinden süre.
 */
export function showNotification(message, type = 'info', duration = 4000) {
    const container = document.getElementById('notification-container');
    if (!container) {
        console.error('Notification container not found!');
        return;
    }

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;

    container.appendChild(notification);

    // Bildirimi kaldırmak için zamanlayıcı
    setTimeout(() => {
        notification.classList.add('fade-out');
        // Animasyon bittiğinde elementi DOM'dan kaldır
        notification.addEventListener('animationend', () => {
            notification.remove();
        });
    }, duration);
}
