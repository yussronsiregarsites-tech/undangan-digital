const CACHE_NAME = 'undangan-v2.0';
const ASSETS = ['./', './index.html', './manifest.json'];

self.addEventListener('install', e => {
  console.log('[SW] Installing...');
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)).catch(err => console.warn(err)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  console.log('[SW] Activating...');
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.map(k => k !== CACHE_NAME && caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = e.request.url;
  
  // API - Network first
  if (url.includes('script.google.com')) {
    e.respondWith(
      fetch(e.request).then(r => {
        if (r && r.status === 200) {
          const clone = r.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
        }
        return r;
      }).catch(() => caches.match(e.request))
    );
    return;
  }
  
  // CDN & Assets - Cache first
  e.respondWith(
    caches.match(e.request).then(r => {
      return r || fetch(e.request).then(resp => {
        if (resp && resp.status === 200 && resp.type === 'basic') {
          const clone = resp.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
        }
        return resp;
      }).catch(() => {
        if (e.request.mode === 'navigate') return caches.match('./index.html');
      });
    })
  );
});
