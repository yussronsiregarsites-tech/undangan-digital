const CACHE_NAME = 'undangan-v1.0';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Install - Cache assets
self.addEventListener('install', event => {
  console.log('[SW] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS_TO_CACHE).catch(err => {
        console.warn('[SW] Cache failed:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate - Clean old caches
self.addEventListener('activate', event => {
  console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch - Cache-first untuk assets, Network-first untuk API
self.addEventListener('fetch', event => {
  const url = event.request.url;
  
  // API calls - Network first
  if (url.includes('script.google.com')) {
    event.respondWith(
      fetch(event.request, { mode: 'cors' })
        .then(response => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }
  
  // CDN resources - Cache first
  if (url.includes('cdn.tailwindcss.com') || 
      url.includes('unpkg.com') || 
      url.includes('cdnjs.cloudflare.com') ||
      url.includes('fonts.googleapis.com') ||
      url.includes('fonts.gstatic.com')) {
    event.respondWith(
      caches.match(event.request).then(response => {
        return response || fetch(event.request).then(fetchResponse => {
          if (fetchResponse && fetchResponse.status === 200) {
            const clone = fetchResponse.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          }
          return fetchResponse;
        });
      })
    );
    return;
  }
  
  // Static assets - Cache first
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request).then(fetchResponse => {
        if (fetchResponse && fetchResponse.status === 200 && fetchResponse.type === 'basic') {
          const clone = fetchResponse.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return fetchResponse;
      }).catch(() => {
        // Fallback untuk navigasi
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      });
    })
  );
});
