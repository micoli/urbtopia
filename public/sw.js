const CACHE = 'urbtopia-__BUILD_ID__';
const FILES_CACHE = 'urbtopia-files';
const PRECACHED_FILES = __PRECACHED_FILES__;
const PACK_FILES = __PACK_FILES__;
const VERSIONED_FILES = __VERSIONED_FILES__;
const CONTENT_TYPES = { glb: 'model/gltf-binary', png: 'image/png', json: 'application/json' };

const versionedEntries = new Map(
  Object.entries(VERSIONED_FILES).map(([path, [version, pack, offset, size]]) => {
    const url = new URL(path, self.location).href;
    return [url, { key: `${url}?v=${version}`, pack, offset, size }];
  }),
);
const packMembers = PACK_FILES.map((_, index) => [...versionedEntries].filter(([, entry]) => entry.pack === index));
const loadingPacks = new Map();
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
  const current = new Set([...versionedEntries.values()].map((entry) => entry.key));
  const stored = await cache.keys();
  await Promise.all(stored.filter((request) => !current.has(request.url)).map((request) => cache.delete(request)));
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

const contentType = (url) => CONTENT_TYPES[url.split('.').pop()] ?? 'application/octet-stream';

// One request brings a whole pack of files, which are then stored one by one under their versioned key.
const unpack = async (index) => {
  const cache = await caches.open(FILES_CACHE);
  const response = await fetch(new URL(PACK_FILES[index], self.location));
  if (!response.ok) throw new Error(`pack ${index}: ${response.status}`);
  const data = await response.arrayBuffer();
  await Promise.all(
    packMembers[index].map(async ([url, { key, offset, size }]) => {
      if (await cache.match(key)) return;
      await cache.put(key, new Response(data.slice(offset, offset + size), { headers: { 'Content-Type': contentType(url) } }));
    }),
  );
};

const loadPack = (index) => {
  if (!loadingPacks.has(index)) {
    loadingPacks.set(
      index,
      unpack(index).catch((error) => {
        loadingPacks.delete(index);
        throw error;
      }),
    );
  }
  return loadingPacks.get(index);
};

const versionedFirst = async (request, { key, pack }) => {
  const cache = await caches.open(FILES_CACHE);
  const cached = await cache.match(key);
  if (cached) return cached;
  const packed = await loadPack(pack).then(() => cache.match(key), () => undefined);
  if (packed) return packed;
  const response = await fetch(request);
  if (response.ok) cache.put(key, response.clone());
  return response;
};

const isGuide = (url) => url.startsWith(new URL('./docs/', self.location).href);

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin || isGuide(request.url)) return;
  if (request.mode === 'navigate') return event.respondWith(networkFirst(request));
  const entry = versionedEntries.get(request.url);
  event.respondWith(entry ? versionedFirst(request, entry) : cacheFirst(request));
});
