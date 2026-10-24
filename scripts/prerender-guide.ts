import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { createServer } from 'vite';
import type { CodexManifest } from '../src/codex/catalog';
import type { GuideRoute } from '../src/guide/routes';
import type { SearchItem } from '../src/guide/search/searchIndex';
import type { Language } from '../src/i18n/prefsStore';
import type { RenderedGuidePage } from '../src/guide/server';

const dist = process.argv[2] ?? 'dist';
const guideDir = join(dist, 'docs');

interface GuideServer {
  GUIDE_LANGUAGES: readonly Language[];
  GUIDE_ROUTES: readonly GuideRoute[];
  searchIndexOf: (language: Language) => SearchItem[];
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
    const { GUIDE_LANGUAGES, GUIDE_ROUTES, docsRootOf, renderGuidePage, searchIndexOf } = await server.ssrLoadModule('/src/guide/server.tsx') as GuideServer;
    const pages = GUIDE_ROUTES.map(route => ({ target: join(guideDir, route.path, 'index.html'), content: pageOf(template, route, docsRootOf(route), renderGuidePage(route, manifest)) }));
    const indexes = GUIDE_LANGUAGES.map(language => ({ target: join(guideDir, language, 'search.json'), content: JSON.stringify(searchIndexOf(language)) }));
    for (const { target, content } of [...pages, ...indexes]) {
      mkdirSync(dirname(target), { recursive: true });
      writeFileSync(target, content);
    }
    console.log(`✓ Guide: ${GUIDE_ROUTES.length} pages`);
  } finally {
    await server.close();
  }
}

if (process.argv[1]?.endsWith('prerender-guide.ts')) await prerender();
