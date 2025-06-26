<<<<<<< HEAD
// js/rating.js
console.log('rating.js yüklendi.'); // Konsol mesajı eklendi
import { STAR_SVG_PATH, HALF_STAR_GRADIENT_ID } from './utils.js';

export let currentRating = 0; // Puanlama için mevcut yıldız sayısı

/**
 * Yıldız puanlama arayüzünü oluşturur ve olay dinleyicileri ekler (modal için).
 * @param {HTMLElement} ratingInputDiv - Yıldızların ekleneceği DOM elementi.
 * @param {number} initialRating - Başlangıç puanı.
 */
export function setupStarRating(ratingInputDiv, initialRating = 0) {
    console.log('setupStarRating çağrıldı, başlangıç puanı:', initialRating); // Konsol mesajı
    ratingInputDiv.innerHTML = ''; // Önceki yıldızları temizle
    currentRating = initialRating;

    for (let i = 1; i <= 5; i++) {
        const starContainer = document.createElement('span');
        starContainer.classList.add('star-container'); // SVG için kapsayıcı kullan
        starContainer.dataset.value = i;

        starContainer.innerHTML = `
            <svg class="star-svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="${STAR_SVG_PATH}"/>
            </svg>
        `;
        ratingInputDiv.appendChild(starContainer);

        // Fare hover olayları görsel geri bildirim için
        starContainer.addEventListener('mousemove', (e) => {
            const rect = starContainer.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const starValue = parseFloat(starContainer.dataset.value);

            // Fare imlecinin yıldızın sol veya sağ yarısında olup olmadığını belirle
            if (x < rect.width / 2) {
                updateStarVisualsOnHover(ratingInputDiv, starValue - 0.5);
            } else {
                updateStarVisualsOnHover(ratingInputDiv, starValue);
            }
        });

        starContainer.addEventListener('mouseleave', () => {
            updateStarVisualsOnHover(ratingInputDiv, currentRating); // Gerçek seçili puana geri dön
        });

        // Derecelendirmeyi ayarlamak için tıklama olayı
        starContainer.addEventListener('click', (e) => {
            const clickedValue = parseFloat(starContainer.dataset.value);
            let newRatingCandidate;

            const rect = starContainer.getBoundingClientRect();
            const x = e.clientX - rect.left;
            if (x < rect.width / 2) {
                newRatingCandidate = clickedValue - 0.5;
            } else {
                newRatingCandidate = clickedValue;
            }

            if (currentRating === newRatingCandidate) {
                // Eğer mevcut puan zaten tıklanan puansa, tam/yarım/sıfır arasında geçiş yap
                if (currentRating === clickedValue) {
                    currentRating = clickedValue - 0.5; // Tamdan yarıma
                } else if (currentRating === clickedValue - 0.5) {
                    currentRating = clickedValue; // Yarımdan tama
                }
            } else {
                currentRating = newRatingCandidate; // Tıklanan yeni puana ayarla
            }

            if (currentRating < 0) currentRating = 0; // Puanın 0'ın altına düşmemesini sağla
            console.log('Yeni puan:', currentRating); // Konsol mesajı
            updateStarVisuals(ratingInputDiv, currentRating); // Seçili duruma göre görselleri güncelle
            updateStarVisualsOnHover(ratingInputDiv, currentRating); // Hover görsellerini seçiliyle eşleştir
        });
    }
    updateStarVisuals(ratingInputDiv, currentRating); // Başlangıçtaki puana göre görselleri başlat
}

/**
 * Yıldız görsellerini güncelleyen ana fonksiyon (seçili durum için).
 * @param {HTMLElement} ratingInputDiv - Yıldızların bulunduğu DOM elementi.
 * @param {number} rating - Güncel puan.
 */
export function updateStarVisuals(ratingInputDiv, rating) {
    const starContainers = ratingInputDiv.querySelectorAll('.star-container');
    starContainers.forEach(container => {
        const starValue = parseFloat(container.dataset.value);
        const svgPath = container.querySelector('path');

        container.classList.remove('selected', 'selected-half'); // Önceki sınıfları kaldır

        if (rating >= starValue) {
            container.classList.add('selected'); // Tam yıldız
            svgPath.setAttribute('fill', '#FFD700'); // Altın rengi
        } else if (rating === starValue - 0.5) {
            container.classList.add('selected-half');
            svgPath.setAttribute('fill', `url(#${HALF_STAR_GRADIENT_ID})`); // Gradient dolgu
        } else {
            svgPath.setAttribute('fill', '#666666'); // Gri renk (boş)
        }
    });
}

/**
 * Yıldız görsellerini hover durumuna göre güncelleyen fonksiyon.
 * @param {HTMLElement} ratingInputDiv - Yıldızların bulunduğu DOM elementi.
 * @param {number} hoverRating - Fare imlecinin üzerinde olduğu puan.
 */
export function updateStarVisualsOnHover(ratingInputDiv, hoverRating) {
    const starContainers = ratingInputDiv.querySelectorAll('.star-container');
    starContainers.forEach(container => {
        const starValue = parseFloat(container.dataset.value);
        const svgPath = container.querySelector('path');

        container.classList.remove('hovered', 'hovered-half'); // Önceki hover sınıflarını kaldır

        if (hoverRating >= starValue) {
            container.classList.add('hovered');
            svgPath.setAttribute('fill', '#FFD700'); // Hover edilen tam yıldız
        } else if (hoverRating === starValue - 0.5) {
            container.classList.add('hovered-half');
            svgPath.setAttribute('fill', `url(#${HALF_STAR_GRADIENT_ID})`); // Hover edilen yarım yıldız
        } else {
            // Eğer hover edilmiyorsa, seçili olan durumu göster
            if (currentRating >= starValue) {
                svgPath.setAttribute('fill', '#FFD700');
            } else if (currentRating === starValue - 0.5) {
                svgPath.setAttribute('fill', `url(#${HALF_STAR_GRADIENT_ID})`);
            } else {
                svgPath.setAttribute('fill', '#666666');
            }
        }
    });
}

/**
 * Modül dışından currentRating'i güncellemek için kullanılır.
 * @param {number} newRating - Yeni puan değeri.
 */
export function setCurrentRating(newRating) {
    currentRating = newRating;
}
=======
// js/rating.js
console.log('rating.js yüklendi.'); // Konsol mesajı eklendi
import { STAR_SVG_PATH, HALF_STAR_GRADIENT_ID } from './utils.js';

export let currentRating = 0; // Puanlama için mevcut yıldız sayısı

/**
 * Yıldız puanlama arayüzünü oluşturur ve olay dinleyicileri ekler (modal için).
 * @param {HTMLElement} ratingInputDiv - Yıldızların ekleneceği DOM elementi.
 * @param {number} initialRating - Başlangıç puanı.
 */
export function setupStarRating(ratingInputDiv, initialRating = 0) {
    console.log('setupStarRating çağrıldı, başlangıç puanı:', initialRating); // Konsol mesajı
    ratingInputDiv.innerHTML = ''; // Önceki yıldızları temizle
    currentRating = initialRating;

    for (let i = 1; i <= 5; i++) {
        const starContainer = document.createElement('span');
        starContainer.classList.add('star-container'); // SVG için kapsayıcı kullan
        starContainer.dataset.value = i;

        starContainer.innerHTML = `
            <svg class="star-svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="${STAR_SVG_PATH}"/>
            </svg>
        `;
        ratingInputDiv.appendChild(starContainer);

        // Fare hover olayları görsel geri bildirim için
        starContainer.addEventListener('mousemove', (e) => {
            const rect = starContainer.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const starValue = parseFloat(starContainer.dataset.value);

            // Fare imlecinin yıldızın sol veya sağ yarısında olup olmadığını belirle
            if (x < rect.width / 2) {
                updateStarVisualsOnHover(ratingInputDiv, starValue - 0.5);
            } else {
                updateStarVisualsOnHover(ratingInputDiv, starValue);
            }
        });

        starContainer.addEventListener('mouseleave', () => {
            updateStarVisualsOnHover(ratingInputDiv, currentRating); // Gerçek seçili puana geri dön
        });

        // Derecelendirmeyi ayarlamak için tıklama olayı
        starContainer.addEventListener('click', (e) => {
            const clickedValue = parseFloat(starContainer.dataset.value);
            let newRatingCandidate;

            const rect = starContainer.getBoundingClientRect();
            const x = e.clientX - rect.left;
            if (x < rect.width / 2) {
                newRatingCandidate = clickedValue - 0.5;
            } else {
                newRatingCandidate = clickedValue;
            }

            if (currentRating === newRatingCandidate) {
                // Eğer mevcut puan zaten tıklanan puansa, tam/yarım/sıfır arasında geçiş yap
                if (currentRating === clickedValue) {
                    currentRating = clickedValue - 0.5; // Tamdan yarıma
                } else if (currentRating === clickedValue - 0.5) {
                    currentRating = clickedValue; // Yarımdan tama
                }
            } else {
                currentRating = newRatingCandidate; // Tıklanan yeni puana ayarla
            }

            if (currentRating < 0) currentRating = 0; // Puanın 0'ın altına düşmemesini sağla
            console.log('Yeni puan:', currentRating); // Konsol mesajı
            updateStarVisuals(ratingInputDiv, currentRating); // Seçili duruma göre görselleri güncelle
            updateStarVisualsOnHover(ratingInputDiv, currentRating); // Hover görsellerini seçiliyle eşleştir
        });
    }
    updateStarVisuals(ratingInputDiv, currentRating); // Başlangıçtaki puana göre görselleri başlat
}

/**
 * Yıldız görsellerini güncelleyen ana fonksiyon (seçili durum için).
 * @param {HTMLElement} ratingInputDiv - Yıldızların bulunduğu DOM elementi.
 * @param {number} rating - Güncel puan.
 */
export function updateStarVisuals(ratingInputDiv, rating) {
    const starContainers = ratingInputDiv.querySelectorAll('.star-container');
    starContainers.forEach(container => {
        const starValue = parseFloat(container.dataset.value);
        const svgPath = container.querySelector('path');

        container.classList.remove('selected', 'selected-half'); // Önceki sınıfları kaldır

        if (rating >= starValue) {
            container.classList.add('selected'); // Tam yıldız
            svgPath.setAttribute('fill', '#FFD700'); // Altın rengi
        } else if (rating === starValue - 0.5) {
            container.classList.add('selected-half');
            svgPath.setAttribute('fill', `url(#${HALF_STAR_GRADIENT_ID})`); // Gradient dolgu
        } else {
            svgPath.setAttribute('fill', '#666666'); // Gri renk (boş)
        }
    });
}

/**
 * Yıldız görsellerini hover durumuna göre güncelleyen fonksiyon.
 * @param {HTMLElement} ratingInputDiv - Yıldızların bulunduğu DOM elementi.
 * @param {number} hoverRating - Fare imlecinin üzerinde olduğu puan.
 */
export function updateStarVisualsOnHover(ratingInputDiv, hoverRating) {
    const starContainers = ratingInputDiv.querySelectorAll('.star-container');
    starContainers.forEach(container => {
        const starValue = parseFloat(container.dataset.value);
        const svgPath = container.querySelector('path');

        container.classList.remove('hovered', 'hovered-half'); // Önceki hover sınıflarını kaldır

        if (hoverRating >= starValue) {
            container.classList.add('hovered');
            svgPath.setAttribute('fill', '#FFD700'); // Hover edilen tam yıldız
        } else if (hoverRating === starValue - 0.5) {
            container.classList.add('hovered-half');
            svgPath.setAttribute('fill', `url(#${HALF_STAR_GRADIENT_ID})`); // Hover edilen yarım yıldız
        } else {
            // Eğer hover edilmiyorsa, seçili olan durumu göster
            if (currentRating >= starValue) {
                svgPath.setAttribute('fill', '#FFD700');
            } else if (currentRating === starValue - 0.5) {
                svgPath.setAttribute('fill', `url(#${HALF_STAR_GRADIENT_ID})`);
            } else {
                svgPath.setAttribute('fill', '#666666');
            }
        }
    });
}

/**
 * Modül dışından currentRating'i güncellemek için kullanılır.
 * @param {number} newRating - Yeni puan değeri.
 */
export function setCurrentRating(newRating) {
    currentRating = newRating;
}
>>>>>>> 0774527a2897dff5e06e515d8b1bb027ffd7a00e
