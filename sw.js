const CACHE_NAME = 'fish-finder-v1';
const ASSETS_TO_CACHE = [
  './index.html',
  './manifest.json',
  './lakesData.json',
  // It will cache the images as it loads them, but we can pre-cache a few:
  './images/walleye.png',
  './images/largemouthbass.png',
  './images/pike.png'
];

// Install event: Cache the core files
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// Fetch event: Serve from cache if offline
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Return the cached version if we have it, otherwise fetch from network
      return cachedResponse || fetch(event.request).then((networkResponse) => {
        // Cache new images dynamically as the user scrolls
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