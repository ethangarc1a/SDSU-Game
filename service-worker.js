/* Simple offline cache for SDSU Game */
const VERSION = 'v3';
const CACHE = `sdsu-${VERSION}`;
const CORE = [
  './',
  './index.html',
  './styles.css?v=3',
  './app.js',
  './deck.js',
  './resume.html',
  './site.webmanifest',
  './icon.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(CORE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => (k !== CACHE && k.startsWith('sdsu-')) ? caches.delete(k) : Promise.resolve()))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  event.respondWith(
    caches.match(req).then(cached => {
      const fetchPromise = fetch(req).then(res => {
        try {
          const copy = res.clone();
          if (res.ok) caches.open(CACHE).then(cache => cache.put(req, copy)).catch(()=>{});
        } catch {}
        return res;
      }).catch(() => cached);
      return cached || fetchPromise;
    })
  );
});

