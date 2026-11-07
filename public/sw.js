const CACHE = 'urbtopia-__BUILD_ID__';
const FILES_CACHE = 'urbtopia-files';
const PRECACHED_FILES = __PRECACHED_FILES__;
const VERSIONED_FILES = __VERSIONED_FILES__;
const WARM_CONCURRENCY = 3;
const WARM_GAP_MS = 100;
const TOO_MANY_REQUESTS = 429;

const versionedKeys = new Map(
  Object.entries(VERSIONED_FILES).map(([path, version]) => {
    const url = new URL(path, self.location).href;
    return [url, `${url}?v=${version}`];
  }),
);
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

const pruneFiles = async () => {
  const cache = await caches.open(FILES_CACHE);
  const current = new Set(versionedKeys.values());
  const stored = await cache.keys();
  await Promise.all(stored.filter((request) => !current.has(request.url)).map((request) => cache.delete(request)));
};

const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const warmFiles = async () => {
  const cache = await caches.open(FILES_CACHE);
  const stored = new Set((await cache.keys()).map((request) => request.url));
  const pending = [...versionedKeys].filter(([, key]) => !stored.has(key));
  let halted = false;
  const worker = async () => {
    while (!halted && pending.length > 0) {
      const [url, key] = pending.pop();
      try {
        const response = await fetch(url);
        if (response.status === TOO_MANY_REQUESTS) halted = true;
        else if (response.ok) await cache.put(key, response);
      } catch {
        halted = true;
      }
      await pause(WARM_GAP_MS);
    }
  };
  await Promise.all(Array.from({ length: WARM_CONCURRENCY }, worker));
};

self.addEventListener('install', (event) => {
  event.waitUntil(precache().then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE && key !== FILES_CACHE).map((key) => caches.delete(key))))
      .then(pruneFiles)
      .then(() => self.clients.claim())
      .then(warmFiles),
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

const versionedFirst = async (request, key) => {
  const cache = await caches.open(FILES_CACHE);
  const cached = await cache.match(key);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) cache.put(key, response.clone());
  return response;
};

const isGuide = (url) => url.startsWith(new URL('./docs/', self.location).href);

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin || isGuide(request.url)) return;
  if (request.mode === 'navigate') return event.respondWith(networkFirst(request));
  const key = versionedKeys.get(request.url);
  event.respondWith(key ? versionedFirst(request, key) : cacheFirst(request));
});
