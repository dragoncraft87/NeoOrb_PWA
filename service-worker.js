const CACHE_NAME = 'neoorb-pwa-v2';
const ASSETS = ['.', 'index.html'];

self.addEventListener('install', evt => {
  evt.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)));
});

self.addEventListener('activate', evt => {
  evt.waitUntil(caches.keys().then(keys => Promise.all(
    keys.map(k => (k!==CACHE_NAME)?caches.delete(k):null)
  )));
});

self.addEventListener('fetch', evt => {
  evt.respondWith(caches.match(evt.request).then(r => r||fetch(evt.request)));
});
