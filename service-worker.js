// 1. Versionsnummer erhöhen!
const CACHE_NAME = 'neoOrb-v2'; 

// 2. Alle benötigten Dateien hinzufügen (inkl. Icons!)
const FILES_TO_CACHE = [
  '/',
  'index.html', // Sicherer ohne / am Anfang
  'manifest.json',
  'favicon.ico',
  'icons/icon-192.png', // WICHTIG: Icon hinzufügen
  'icons/icon-512.png', // WICHTIG: Icon hinzufügen
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.2.0/js/all.min.js'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => {
    console.log('Service Worker: Caching files');
    return cache.addAll(FILES_TO_CACHE);
  }));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Alter Cache wird gelöscht', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      // Gibt die Datei aus dem Cache zurück, oder holt sie vom Netzwerk, wenn nicht im Cache
      return response || fetch(event.request);
    })
  );
});
