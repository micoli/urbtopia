const CACHE = 'urbtopia-__BUILD_ID__';
const PRECACHED_FILES = __PRECACHED_FILES__;
const ASSET_PATTERN = /(?:src|href)="([^"]+\/assets\/[^"]+)"/g;

const precache = async () => {
  const cache = await caches.open(CACHE);
  const indexUrl = new URL('./', self.location).href;
  const response = await fetch(indexUrl, { cache: 'reload' });
  const html = await response.clone().text();
  await cache.put(indexUrl, response);
  const assets = [...html.matchAll(ASSET_PATTERN)].map(([, path]) => new URL(path, indexUrl).href);
  const files = PRECACHED_FILES.map((path) => new URL(path, indexUrl).href);
  await cache.addAll([...assets, ...files]);
};

self.addEventListener('install', (event) => {
  event.waitUntil(precache().then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

const networkFirst = async (request) => {
  const cache = await caches.open(CACHE);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(new URL('./', self.location).href, response.clone());
    return response;
  } catch {
    return (await cache.match(new URL('./', self.location).href)) ?? Response.error();
  }
};

const cacheFirst = async (request) => {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) cache.put(request, response.clone());
  return response;
};

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;
  event.respondWith(request.mode === 'navigate' ? networkFirst(request) : cacheFirst(request));
});
