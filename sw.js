const CACHE_NAME = 'fish-finder-v28';
const ASSETS_TO_CACHE = [
  './index.html',
  './manifest.json',
  './images/icon.png'
];

// Install event: Cache the core files and force the new SW to take over immediately
self.addEventListener('install', (event) => {
  self.skipWaiting(); 
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// Activate event: Clean up old caches and claim control of the open tabs
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
    }).then(() => self.clients.claim()) // Takes control of the page immediately
  );
});

// Fetch event: Smart routing
self.addEventListener('fetch', (event) => {
  
  // STRATEGY 1: Network-First for the Lake Database
  if (event.request.url.includes('lakesData.json')) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          // We got a good response from the internet! Save a copy to the cache.
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
          return networkResponse;
        })
        .catch(() => {
          // We are offline! Serve the database from the cache instead.
          console.log('Offline: Serving lakesData.json from cache');
          return caches.match(event.request);
        })
    );
    return; // Stop here so it doesn't run the other strategy
  }

  // STRATEGY 2: Cache-First for images, HTML, and everything else
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return cachedResponse || fetch(event.request).then((networkResponse) => {
        // Dynamically cache new images as the user scrolls
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