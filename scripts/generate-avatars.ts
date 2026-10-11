import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from '@playwright/test';
import { createServer } from 'vite';
import type { AvatarRenderer } from './avatar-render';

const output = 'public/avatars';
const manifestPath = join(output, 'manifest.json');
const force = process.argv.includes('--force');

function fingerprintOf(): string {
  const models = 'public/models/mini-characters';
  const files = ['package-lock.json', 'src/social/avatar.ts', 'scripts/generate-avatars.ts', 'scripts/avatar-render.ts', 'scripts/avatar-render.html', ...readdirSync(models).filter(name => name.endsWith('.glb') || name === 'Textures').flatMap(name => {
    const file = join(models, name);
    return statSync(file).isDirectory() ? readdirSync(file).map(inner => join(file, inner)) : [file];
  }).sort()];
  const hash = createHash('sha256');
  for (const file of files) hash.update(file).update(readFileSync(file));
  return hash.digest('hex');
}

function cached(fingerprint: string): boolean {
  if (force || !existsSync(manifestPath)) return false;
  try {
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as { fingerprint: string; avatars: string[] };
    return manifest.fingerprint === fingerprint && manifest.avatars.length > 0 && manifest.avatars.every(id => existsSync(join(output, `${id}.png`)));
  } catch {
    return false;
  }
}

async function generate(): Promise<void> {
  const fingerprint = fingerprintOf();
  if (cached(fingerprint)) return console.log('✓ Avatars already generated');
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
    await page.goto(`${server.resolvedUrls!.local[0]}scripts/avatar-render.html`);
    await page.waitForFunction(() => !!window.avatarRenderer, null, { timeout: 60_000 }).catch(error => {
      throw new Error(failures.length ? failures.join('\n') : String(error));
    });
    mkdirSync(output, { recursive: true });
    const ids = await page.evaluate(() => window.avatarRenderer.ids) as AvatarRenderer['ids'];
    for (const id of ids) {
      const data = await page.evaluate(key => window.avatarRenderer.render(key), id);
      writeFileSync(join(output, `${id}.png`), Buffer.from(data.split(',')[1]!, 'base64'));
    }
    if (failures.length) throw new Error(failures.join('\n'));
    writeFileSync(manifestPath, `${JSON.stringify({ fingerprint, avatars: ids }, null, 2)}\n`);
    console.log(`✓ Avatars: ${ids.length} portraits`);
  } finally {
    await browser?.close();
    await server.close();
  }
}

await generate().catch(error => { console.error(error); process.exitCode = 1; });
