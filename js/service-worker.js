    const CACHE_NAME = 'pandaflicks-cache-v1'; // Bu ismi değiştirmeden bırakabilirsiniz veya pandaflicks-cache-v1 yapabilirsiniz
    const urlsToCache = [
      '/',
      '/index.html',
      '/style.css', // Eğer ayrı bir CSS dosyanız varsa
      '/script.js', // Eğer ayrı bir JS dosyanız varsa (Ana HTML içinden ayrılmışsa)
      'https://cdn.tailwindcss.com',
      'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap',
      // PWA ikonları (icons klasörünü projenizin kök dizinine eklemelisiniz)
      '/icons/icon-192x192.png',
      '/icons/icon-512x512.png',
      '/icons/icon-apple.png'
    ];

    self.addEventListener('install', event => {
      event.waitUntil(
        caches.open(CACHE_NAME)
          .then(cache => {
            console.log('Opened cache');
            return cache.addAll(urlsToCache);
          })
      );
    });

    self.addEventListener('fetch', event => {
      event.respondWith(
        caches.match(event.request)
          .then(response => {
            // Cache'de varsa geri döndür
            if (response) {
              return response;
            }
            // Cache'de yoksa ağı kullan
            return fetch(event.request).then(
              function(response) {
                // Yanıt geçerliyse cache'e ekle
                if (!response || response.status !== 200 || response.type !== 'basic') {
                  return response;
                }
                var responseToCache = response.clone();
                caches.open(CACHE_NAME)
                  .then(function(cache) {
                    cache.put(event.request, responseToCache);
                  });
                return response;
              }
            );
          })
      );
    });

    self.addEventListener('activate', event => {
      const cacheWhitelist = [CACHE_NAME];
      event.waitUntil(
        caches.keys().then(cacheNames => {
          return Promise.all(
            cacheNames.map(cacheName => {
              if (cacheWhitelist.indexOf(cacheName) === -1) {
                return caches.delete(cacheName); // Eski cache'leri sil
              }
            })
          );
        })
      );
    });