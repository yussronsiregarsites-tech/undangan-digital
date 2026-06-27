const CACHE_NAME = 'undangan-v2.1'; // ✅ Naikkan versi untuk force refresh
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',  // ✅ Tambah icon ke cache
  './icon-512.png'   // ✅ Tambah icon ke cache
];

self.addEventListener('install', e => {
  console.log('[SW] Installing...');
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(c => c.addAll(ASSETS))
      .catch(err => console.warn('[SW] Cache install failed:', err))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  console.log('[SW] Activating...');
  e.waitUntil(
    caches.keys().then(keys => 
      Promise.all(
        keys.map(k => {
          if (k !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', k);
            return caches.delete(k);
          }
        })
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = e.request.url;
  
  // API Google Apps Script - Network first
  if (url.includes('script.google.com')) {
    e.respondWith(
      fetch(e.request, { mode: 'cors' })
        .then(r => {
          if (r && r.status === 200) {
            const clone = r.clone();
            caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
          }
          return r;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }
  
  // CDN Resources - Cache first with network fallback
  if (url.includes('cdn.tailwindcss.com') || 
      url.includes('unpkg.com') || 
      url.includes('cdnjs.cloudflare.com') ||
      url.includes('fonts.googleapis.com') ||
      url.includes('fonts.gstatic.com')) {
    e.respondWith(
      caches.match(e.request).then(r => {
        return r || fetch(e.request).then(resp => {
          if (resp && resp.status === 200) {
            const clone = resp.clone();
            caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
          }
          return resp;
        }).catch(() => {
          // Fallback jika CDN gagal
          return new Response('CDN resource unavailable', { status: 503 });
        });
      })
    );
    return;
  }
  
  // Static Assets - Cache first
  e.respondWith(
    caches.match(e.request).then(r => {
      return r || fetch(e.request).then(resp => {
        if (resp && resp.status === 200 && resp.type === 'basic') {
          const clone = resp.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
        }
        return resp;
      }).catch(() => {
        // Fallback untuk navigasi
        if (e.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
