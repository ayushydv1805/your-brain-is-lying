const CACHE_NAME = 'ybil-shell-v1';
const APP_SHELL = ['/index.html', '/manifest.webmanifest', '/brain-mark.svg', '/privacy.html'];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(APP_SHELL);

    // Vite emits hashed JS/CSS filenames into the production HTML. Fetch those
    // once during install so a fresh install can launch local play offline.
    const html = await (await cache.match('/index.html')).text();
    const assetPaths = [...html.matchAll(/(?:src|href)=["']([^"']*\/assets\/[^"']+)["']/g)]
      .map((match) => match[1]);
    await Promise.all(assetPaths.map(async (path) => {
      try {
        const assetUrl = new URL(path, self.location.origin);
        if (assetUrl.origin !== self.location.origin) return;
        const response = await fetch(assetUrl);
        if (response.ok) await cache.put(assetUrl.href, response.clone());
      } catch {
        // If a file cannot be pre-cached, online play still works normally.
      }
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys
        .filter((key) => key.startsWith('ybil-shell-') && key !== CACHE_NAME)
        .map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(async (response) => {
          if (response.ok) {
            const copy = response.clone();
            const cache = await caches.open(CACHE_NAME);
            await cache.put('/index.html', copy);
          }
          return response;
        })
        .catch(async () => (await caches.match('/index.html')) || Response.error()),
    );
    return;
  }

  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        const response = await fetch(request);
        if (response.ok) await cache.put(request, response.clone());
        return response;
      }).catch(() => Response.error()),
    );
    return;
  }

  if (url.pathname === '/manifest.webmanifest' || url.pathname === '/brain-mark.svg') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(async () => (await caches.match(request)) || Response.error()),
    );
  }
});
