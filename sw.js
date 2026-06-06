const CACHE = 'aitrainer-v2';
const URLS = [
  './',
  'index.html',
  'question_bank.json',
  'manifest.json'
];

// Install: cache all core files
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache =>
      cache.addAll(URLS).catch(err => {
        // Continue even if some files fail (e.g., question_bank.json too large)
        console.warn('Cache install partial:', err);
      })
    )
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: cache-first for core files, network-first for others
self.addEventListener('fetch', e => {
  // Only handle GET requests
  if (e.request.method !== 'GET') return;

  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      // Network fallback with runtime caching
      return fetch(e.request).then(response => {
        if (!response || response.status !== 200) return response;
        const clone = response.clone();
        caches.open(CACHE).then(cache => cache.put(e.request, clone));
        return response;
      }).catch(() => {
        // Offline fallback — return index.html for navigation requests
        if (e.request.mode === 'navigate') {
          return caches.match('index.html');
        }
        return new Response('Offline', { status: 503 });
      });
    })
  );
});
