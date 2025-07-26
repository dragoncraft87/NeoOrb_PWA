// 1. WICHTIG: Die Cache-Version erhöhen. Das zwingt den Browser zum Update.
const CACHE_NAME = 'neoOrb-v2.01';

// 2. Die Liste der zu cachenden Dateien aktualisieren.
const FILES_TO_CACHE = [
  '/',
  'index.html',
  'manifest.json',
  'css/style.css', // NEU
  'js/app.js',     // NEU
  'icons/icon-192.png',
  'icons/icon-512.png',
  // Die FontAwesome-CSS, die wir in der neuen index.html verwenden
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.2.0/css/all.min.css'
];

// Bei der Installation der PWA werden die Dateien aus der Liste heruntergeladen.
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log(`[Service Worker] Caching app shell: ${CACHE_NAME}`);
      return cache.addAll(FILES_TO_CACHE);
    })
  );
});

// Bei der Aktivierung werden alte Caches gelöscht.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log(`[Service Worker] Deleting old cache: ${cacheName}`);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Dieser "Fetch"-Handler sorgt dafür, dass die App offline funktioniert.
// Er schaut zuerst im Cache nach, und wenn die Datei nicht da ist, versucht er sie aus dem Netzwerk zu laden.
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});