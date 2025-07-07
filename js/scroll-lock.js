// js/scroll-lock.js

// Kaç tane modalın açık olduğunu saymak için bir sayaç
let openModalCount = 0;
// Kaydırma pozisyonunu saklamak için
let savedScrollY = 0;

const body = document.body;

/**
 * Arka plan kaydırmasını kilitler. Sadece ilk modal açıldığında çalışır.
 */
function lock() {
  // Mevcut kaydırma pozisyonunu kaydet
  savedScrollY = window.scrollY;

  // Body'e sabit pozisyon vererek kaydırmayı tamamen engelle
  // ve kaydettiğimiz pozisyon kadar yukarı kaydırarak zıplamasını önle.
  body.style.position = 'fixed';
  body.style.top = `-${savedScrollY}px`;
  body.style.width = '100%'; // Genişliğin bozulmasını engelle
}

/**
 * Arka plan kaydırma kilidini açar. Sadece son modal kapandığında çalışır.
 */
function unlock() {
  // Body'nin stillerini eski haline getir
  body.style.position = '';
  body.style.top = '';
  body.style.width = '';

  // Sayfayı tam olarak kaldığı yere anında geri getir
  window.scrollTo(0, savedScrollY);
}

/**
 * Herhangi bir modal açıldığında çağrılacak fonksiyon.
 */
export function onModalOpen() {
  // Eğer bu açılan ilk modalsa, kilitleme işlemini yap.
  if (openModalCount === 0) {
    lock();
  }
  // Açık modal sayısını artır.
  openModalCount++;
}

/**
 * Herhangi bir modal kapandığında çağrılacak fonksiyon.
 */
export function onModalClose() {
  // Açık modal sayısını azalt.
  openModalCount--;

  // Eğer ekranda hiç açık modal kalmadıysa, kilidi aç.
  if (openModalCount === 0) {
    unlock();
  }
}