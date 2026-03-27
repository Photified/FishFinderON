// Bumped to v2 to force the browser to download the new lakesData.json
const CACHE_NAME = 'fish-finder-v2'; 
const ASSETS_TO_CACHE = [
  './index.html',
  './manifest.json',
  './lakesData.json',
  './images/walleye.png',
  './images/largemouthbass.png',
  './images/pike.png'
];

// Install event: Cache the core files
self.addEventListener('install', (event) => {
  // Skip the 'waiting' lifecycle phase to immediately activate the new service worker
  self.skipWaiting(); 
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// Activate event: Clean up old caches (like v1)
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Clearing old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch event: Serve from cache if offline
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return cachedResponse || fetch(event.request).then((networkResponse) => {
        if (event.request.url.includes('/images/')) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      });
    })
  );
});