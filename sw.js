const CACHE = 'nexgen-v2';
const OFFLINE_URLS = [
  '/nexgen-ecommercesite-v2/',
  '/nexgen-ecommercesite-v2/index.html',
  '/nexgen-ecommercesite-v2/style.css',
  '/nexgen-ecommercesite-v2/js/api.js',
  '/nexgen-ecommercesite-v2/js/auth.js',
  '/nexgen-ecommercesite-v2/js/components.js',
  '/nexgen-ecommercesite-v2/assets/icon-192.png',
  '/nexgen-ecommercesite-v2/assets/icon-512.png',
];

// Install: cache core files
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(OFFLINE_URLS))
  );
  self.skipWaiting();
});

// Activate: clear old caches, take control immediately
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: network first, cache fallback
self.addEventListener('fetch', e => {
  // Skip non-GET and API requests (always fetch live from network)
  if (e.request.method !== 'GET') return;
  if (e.request.url.includes('railway.app')) return;

  e.respondWith(
    fetch(e.request)
      .then(res => {
        // Cache successful responses for static assets
        if (res.ok && (e.request.url.includes('/assets/') || e.request.url.includes('/js/') || e.request.url.endsWith('.css'))) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
