import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { createServer } from 'vite';
import type { CodexManifest } from '../src/codex/catalog';
import type { GuideRoute } from '../src/guide/routes';
import type { RenderedGuidePage } from '../src/guide/server';

const dist = process.argv[2] ?? 'dist';
const guideDir = join(dist, 'docs');

interface GuideServer {
  GUIDE_ROUTES: readonly GuideRoute[];
  docsRootOf: (route: GuideRoute) => string;
  renderGuidePage: (route: GuideRoute, manifest: CodexManifest) => RenderedGuidePage;
}

const escapeHtml = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;');

export function pageOf(template: string, route: GuideRoute, docsRoot: string, { html, title, data }: RenderedGuidePage): string {
  const embedded = route.page.kind === 'languageChoice' ? '' : `<script type="application/json" id="guide-data">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`;
  return template
    .replace(/((?:src|href)=")\.\.\//g, `$1${docsRoot}../`)
    .replace('<html lang="en">', `<html lang="${route.language}">`)
    .replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(title)}</title>`)
    .replace('<!--guide-app-->', html)
    .replace('<!--guide-data-->', embedded);
}

async function prerender(): Promise<void> {
  const template = readFileSync(join(guideDir, 'index.html'), 'utf8');
  if (!template.includes('<!--guide-app-->')) throw new Error(`${guideDir}/index.html is already prerendered: run vite build first`);
  const manifest = JSON.parse(readFileSync(join(dist, 'codex', 'manifest.json'), 'utf8')) as CodexManifest;
  const server = await createServer({ configFile: false, server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' });
  try {
    const { GUIDE_ROUTES, docsRootOf, renderGuidePage } = await server.ssrLoadModule('/src/guide/server.tsx') as GuideServer;
    for (const route of GUIDE_ROUTES) {
      const target = join(guideDir, route.path, 'index.html');
      mkdirSync(dirname(target), { recursive: true });
      writeFileSync(target, pageOf(template, route, docsRootOf(route), renderGuidePage(route, manifest)));
    }
    console.log(`✓ Guide: ${GUIDE_ROUTES.length} pages`);
  } finally {
    await server.close();
  }
}

if (process.argv[1]?.endsWith('prerender-guide.ts')) await prerender();
