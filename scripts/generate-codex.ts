import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, unlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from '@playwright/test';
import { createServer } from 'vite';
import type { CodexManifest } from '../src/codex/catalog';
import type { CodexRenderer } from './codex-render';

const output = 'public/codex';
const manifestPath = join(output, 'manifest.json');
const force = process.argv.includes('--force');

function filesOf(directory: string): string[] {
  return readdirSync(directory).flatMap(name => {
    const file = join(directory, name);
    return statSync(file).isDirectory() ? filesOf(file) : [file];
  }).sort();
}

function fingerprintOf(): string {
  const hash = createHash('sha256');
  const files = ['package-lock.json', 'scripts/generate-codex.ts', 'scripts/codex-render.ts', 'scripts/codex-render.html', ...['src/core', 'src/codex', 'src/scene', 'src/i18n', 'public/models'].flatMap(filesOf)];
  for (const file of files) hash.update(file).update(readFileSync(file));
  return hash.digest('hex');
}

function cached(fingerprint: string): boolean {
  if (force || !existsSync(manifestPath)) return false;
  try {
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as CodexManifest;
    return manifest.fingerprint === fingerprint && Object.keys(manifest.images).length > 0 && Object.values(manifest.images).every(image => /^[a-zA-Z0-9-]+\.png$/.test(image) && existsSync(join(output, image)));
  } catch {
    return false;
  }
}

async function generate(): Promise<void> {
  const fingerprint = fingerprintOf();
  if (cached(fingerprint)) return console.log('✓ Codex previews already generated');
  const server = await createServer({ configFile: false, server: { host: '127.0.0.1', port: 0 }, logLevel: 'error' });
  let browser;
  try {
    await server.listen();
    browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
    const page = await browser.newPage();
    const failures: string[] = [];
    page.on('pageerror', error => failures.push(error.message));
    page.on('console', message => { if (message.type() === 'error') failures.push(message.text()); });
    page.on('response', response => { if (response.status() >= 400) failures.push(`${response.status()} ${response.url()}`); });
    await page.goto(`${server.resolvedUrls!.local[0]}scripts/codex-render.html`);
    await page.waitForFunction(() => !!window.codexRenderer, null, { timeout: 60_000 }).catch(error => {
      throw new Error(failures.length ? failures.join('\n') : String(error));
    });
    if (failures.length) throw new Error(failures.join('\n'));
    const variants = await page.evaluate(() => window.codexRenderer.variants) as CodexRenderer['variants'];
    const manifest: CodexManifest = { fingerprint, images: {} };
    const rendered = new Map<string, string>();
    mkdirSync(output, { recursive: true });
    for (const variant of variants) {
      let image = rendered.get(variant.signature);
      if (!image) {
        const data = await page.evaluate(key => window.codexRenderer.render(key), variant.key);
        const png = Buffer.from(data.split(',')[1]!, 'base64');
        image = `${createHash('sha256').update(png).digest('hex').slice(0, 24)}.png`;
        writeFileSync(join(output, image), png);
        rendered.set(variant.signature, image);
      }
      manifest.images[variant.key] = image;
    }
    if (failures.length) throw new Error(failures.join('\n'));
    writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
    const images = new Set(Object.values(manifest.images));
    for (const file of readdirSync(output)) {
      if (/^[a-f0-9]{24}\.png$/.test(file) && !images.has(file)) unlinkSync(join(output, file));
    }
    console.log(`✓ Codex: ${variants.length} levels, ${rendered.size} previews`);
  } finally {
    await browser?.close();
    await server.close();
  }
}

await generate().catch(error => { console.error(error); process.exitCode = 1; });
