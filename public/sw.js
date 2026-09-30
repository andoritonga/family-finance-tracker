const CACHE_NAME = 'apbk-cache-v3';
const STATIC_ASSETS = [
  '/manifest.webmanifest',
  '/favicon.png',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[SW] Clearing old cache:', key);
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

// DO NOT cache HTML pages, API routes, or Next.js RSC bundles.
// Only cache static images and manifest for PWA offline installability.
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // If requesting a static icon/manifest, serve from cache if available
  if (STATIC_ASSETS.includes(url.pathname)) {
    event.respondWith(
      caches.match(event.request).then((cached) => cached || fetch(event.request))
    );
    return;
  }

  // All other requests (pages, API, Next.js chunks, RSC) go directly to network
  return;
});
