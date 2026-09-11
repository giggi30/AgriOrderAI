self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Necessario per far credere al browser che l'app funzioni offline
  event.respondWith(fetch(event.request));
});
