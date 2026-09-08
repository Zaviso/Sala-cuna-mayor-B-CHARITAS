const CACHE_NAME = 'centro-padres-v4';
const urlsToCache = [
  './',
  './index.html',
  './admin.html',
  './style.css',
  './app.js',
  './manifest.json',
  './zaviso-brand-mark.jpg'
];

self.addEventListener('install', event => {
  // Obliga a que el nuevo Service Worker se instale de inmediato
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('activate', event => {
  // Obliga al SW a tomar control de la página inmediatamente sin recargar
  event.waitUntil(self.clients.claim());
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Estrategia: Network First, falling back to cache
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Si la red responde correctamente, guardamos una copia en cache y devolvemos la respuesta
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Si falla la red (offline), buscamos en la caché
        return caches.match(event.request);
      })
  );
});
