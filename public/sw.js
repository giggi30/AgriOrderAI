const CACHE_NAME = 'agriorder-v1';
const ASSETS = [
  '/',
  '/manifest.json',
  '/apple-touch-icon-192.png',
  '/apple-touch-icon-512.png',
  '/images/olive-oil-icon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  // Ignora le richieste per Supabase o API esterne se necessario
  if (event.request.url.includes('supabase.co')) return;

  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request).then((fetchResponse) => {
        // Opzionale: aggiungi nuovi file alla cache dinamicamente
        return fetchResponse;
      });
    }).catch(() => {
      // Fallback per navigazione offline
      if (event.request.mode === 'navigate') {
        return caches.match('/');
      }
    })
  );
});
