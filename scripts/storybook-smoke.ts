import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from '@playwright/test';

const ROOT = 'storybook-static';
const PORT = 6107;

const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--outDir', ROOT, '--port', String(PORT), '--strictPort', '--host', '127.0.0.1'], { stdio: 'ignore' });
const stopServer = () => server.kill();
process.on('exit', stopServer);
for (let attempt = 0; attempt < 60; attempt++) {
  const ready = await fetch(`http://127.0.0.1:${PORT}/index.json`).then((response) => response.ok, () => false);
  if (ready) break;
  await new Promise((done) => setTimeout(done, 500));
}

const index = JSON.parse(readFileSync(join(ROOT, 'index.json'), 'utf8')) as { entries: Record<string, { id: string; type: string }> };
const stories = Object.values(index.entries).filter((entry) => entry.type === 'story');
const only = process.argv[2];
const problems: string[] = [];
const browser = await chromium.launch();

async function check(storyId: string) {
  const page = await browser.newPage();
  page.on('pageerror', (error) => problems.push(`${storyId}: ${error.message}`));
  page.on('console', (message) => message.type() === 'error' && !message.text().includes('Failed to load resource') && problems.push(`${storyId}: console ${message.text().slice(0, 300)}`));
  await page.goto(`http://127.0.0.1:${PORT}/iframe.html?id=${storyId}&viewMode=story`, { waitUntil: 'domcontentloaded', timeout: 15_000 }).catch(() => problems.push(`${storyId}: navigation timeout`));
  await page.waitForSelector('body.sb-show-main #storybook-root:not(:empty), body.sb-show-errordisplay', { state: 'attached', timeout: 10_000 }).catch(() => problems.push(`${storyId}: nothing rendered`));
  const error = await page.locator('.sb-errordisplay:visible').first().textContent({ timeout: 500 }).catch(() => null);
  if (error) problems.push(`${storyId}: ${error.trim().slice(0, 300)}`);
  await page.close();
}

for (const story of stories.filter((entry) => !only || entry.id.includes(only))) await check(story.id);

await browser.close();
stopServer();
console.log(`${stories.length} stories checked`);
if (problems.length) {
  console.error(problems.join('\n'));
  process.exit(1);
}
