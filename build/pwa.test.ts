import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { VersionedFile } from './packFiles';
import { stampSource } from './stampServiceWorker';

const manifest = JSON.parse(readFileSync('public/manifest.webmanifest', 'utf8')) as {
  name: string;
  start_url: string;
  scope: string;
  display: string;
  icons: { src: string; sizes: string; type: string; purpose?: string }[];
};

describe('web app manifest', () => {
  it('makes the site installable as a standalone app', () => {
    expect(manifest.name).toBe('Urbtopia');
    expect(manifest.display).toBe('standalone');
    expect(manifest.start_url).toBe('./');
    expect(manifest.scope).toBe('./');
  });

  it('declares 192 and 512 icons plus a maskable one, all present on disk', () => {
    const sizes = manifest.icons.map((icon) => icon.sizes);
    expect(sizes).toEqual(expect.arrayContaining(['192x192', '512x512']));
    expect(manifest.icons.some((icon) => icon.purpose === 'maskable')).toBe(true);
    for (const icon of manifest.icons) expect(existsSync(`public/${icon.src}`), icon.src).toBe(true);
  });

  it('is linked from the page together with an Apple touch icon', () => {
    const html = readFileSync('index.html', 'utf8');
    expect(html).toContain('rel="manifest" href="./manifest.webmanifest"');
    expect(html).toContain('rel="apple-touch-icon"');
    expect(html).toContain('name="theme-color"');
  });
});

describe('service worker stamping', () => {
  const source = readFileSync('public/sw.js', 'utf8');

  it('gives every build its own cache name, so a new build is detected as an update', () => {
    const first = stampSource(source, 'aaa', []);
    const second = stampSource(source, 'bbb', []);
    expect(first).toContain("'urbtopia-aaa'");
    expect(second).toContain("'urbtopia-bbb'");
    expect(first).not.toBe(second);
    expect(first).not.toContain('__BUILD_ID__');
  });

  it('leaves the Guide to the network, so a Guide page never replaces the cached game', () => {
    const listeners: Record<string, (event: unknown) => void> = {};
    const self = { location: new URL('https://example.com/urbtopia/sw.js'), addEventListener: (type: string, listener: (event: unknown) => void) => { listeners[type] = listener; } };
    new Function('self', 'caches', stampSource(source, 'aaa', []))(self, {});
    const respondedTo = (url: string) => {
      let responded = false;
      listeners.fetch!({ request: { method: 'GET', url, mode: 'navigate' }, respondWith: (response: Promise<unknown>) => { responded = true; response.catch(() => undefined); } });
      return responded;
    };
    expect(respondedTo('https://example.com/urbtopia/docs/en/codex/buildings/house/')).toBe(false);
    expect(respondedTo('https://example.com/urbtopia/docs/')).toBe(false);
    expect(respondedTo('https://example.com/urbtopia/')).toBe(true);
  });

  it('lists the shell files to precache, the packs and the versioned files kept across builds', () => {
    const stamped = stampSource(source, 'aaa', ['./icon-192.png'], { './models/roads/road-end.glb': ['abc123', 0, 0, 10] }, ['./packs/roads-1.bin']);
    expect(stamped).toContain('["./icon-192.png"]');
    expect(stamped).toContain('["./packs/roads-1.bin"]');
    expect(stamped).toContain('{"./models/roads/road-end.glb":["abc123",0,0,10]}');
    for (const placeholder of ['__PRECACHED_FILES__', '__PACK_FILES__', '__VERSIONED_FILES__']) expect(stamped).not.toContain(placeholder);
  });

  it('fetches a pack once and serves its files from the cache', async () => {
    const base = 'https://example.com/urbtopia/';
    const store = new Map<string, Response>();
    const cache = {
      match: async (key: string | Request) => store.get(typeof key === 'string' ? key : key.url)?.clone(),
      put: async (key: string | Request, response: Response) => void store.set(typeof key === 'string' ? key : key.url, response),
      keys: async () => [...store.keys()].map((url) => new Request(url)),
      delete: async () => true,
    };
    const requested: string[] = [];
    const fetchStub = async (input: string | URL | Request) => {
      requested.push(String(input instanceof Request ? input.url : input));
      return new Response(new Uint8Array([1, 2, 3, 4, 5]));
    };
    const listeners: Record<string, (event: unknown) => void> = {};
    const self = { location: new URL(`${base}sw.js`), addEventListener: (type: string, listener: (event: unknown) => void) => { listeners[type] = listener; } };
    const versioned: Record<string, VersionedFile> = { './models/a.glb': ['v1', 0, 0, 2], './models/b.glb': ['v2', 0, 2, 3] };
    new Function('self', 'caches', 'fetch', stampSource(source, 'aaa', [], versioned, ['./packs/models-1.bin']))(self, { open: async () => cache, keys: async () => [] }, fetchStub);
    const serve = async (path: string) => {
      let response: Promise<Response> | undefined;
      listeners.fetch!({ request: new Request(`${base}${path}`), respondWith: (promise: Promise<Response>) => { response = promise; } });
      return new Uint8Array(await (await response!).arrayBuffer());
    };
    expect([...(await serve('models/a.glb'))]).toEqual([1, 2]);
    expect([...(await serve('models/b.glb'))]).toEqual([3, 4, 5]);
    expect(requested).toEqual([`${base}packs/models-1.bin`]);
  });
});
