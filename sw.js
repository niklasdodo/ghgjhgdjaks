const CACHE_NAME = 'kopflog-v4';
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './apple-touch-icon.png',
  './icon-192.png',
  './icon-512.png',
  './favicon.svg',
  './assets/cinna-mascot.png',
  './assets/cinna-happy.png',
  './assets/cinna-sleepy.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  const networkUpdate = fetch(event.request)
    .then(async (response) => {
      if (response && response.ok) {
        const cache = await caches.open(CACHE_NAME);
        const c1 = response.clone();
        const c2 = event.request.mode === 'navigate' ? response.clone() : null;
        await cache.put(event.request, c1);
        if (c2) await cache.put('./index.html', c2);
      }
      return response;
    })
    .catch(() => null);

  event.waitUntil(networkUpdate);

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached =
        (await cache.match(event.request, { ignoreSearch: true })) ||
        (event.request.mode === 'navigate' ? await cache.match('./index.html') : null);
      if (cached) return cached;
      const net = await networkUpdate;
      return net || (event.request.mode === 'navigate' ? await cache.match('./index.html') : new Response('', { status: 404 }));
    })
  );
});
