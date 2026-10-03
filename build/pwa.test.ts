import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
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

  it('lists the files to precache for offline play', () => {
    const stamped = stampSource(source, 'aaa', ['./models/roads/road-end.glb']);
    expect(stamped).toContain('["./models/roads/road-end.glb"]');
    expect(stamped).not.toContain('__PRECACHED_FILES__');
  });
});
