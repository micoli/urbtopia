import { describe, expect, it } from 'vitest';
import { CODEX_ENTRIES, CODEX_SECTIONS } from '../codex/catalog';
import { CODEX_PAGES } from '../codex/pages';
import { docsRootOf, gameRootOf, GUIDE_LANGUAGES, GUIDE_ROUTES, guideRouteOf, hrefOf, translatedPathOf } from './routes';

describe('guideRouteOf', () => {
  it('finds a page whatever sub-path the site is served from', () => {
    expect(guideRouteOf('/urbtopia/docs/fr/codex/housing/home/').page).toEqual({ kind: 'codexEntry', id: 'home' });
    expect(guideRouteOf('/docs/fr/codex/housing/home/index.html').language).toBe('fr');
    expect(guideRouteOf('/docs/en').page).toEqual({ kind: 'home' });
  });

  it('falls back to the language choice for the root and unknown pages', () => {
    expect(guideRouteOf('/docs/').page.kind).toBe('languageChoice');
    expect(guideRouteOf('/docs/en/nowhere/').page.kind).toBe('languageChoice');
  });
});

describe('relative links', () => {
  it('climb back to the Guide and the game from a nested page', () => {
    const route = guideRouteOf('/docs/en/codex/housing/home/');
    expect(docsRootOf(route)).toBe('../../../../');
    expect(gameRootOf(route)).toBe('../../../../../');
    expect(hrefOf(route, 'fr/')).toBe('../../../../fr/');
    expect(hrefOf(guideRouteOf('/docs/'), '')).toBe('./');
  });
});

describe('translatedPathOf', () => {
  it('keeps the page and swaps the language', () => {
    expect(translatedPathOf(guideRouteOf('/docs/en/codex/housing/home/'), 'fr')).toBe('fr/codex/housing/home/');
    expect(translatedPathOf(guideRouteOf('/docs/fr/'), 'en')).toBe('en/');
  });
});

describe('route catalogue', () => {
  it('gives every Codex entry, section and rule page one page per language', () => {
    for (const language of GUIDE_LANGUAGES) {
      const routes = GUIDE_ROUTES.filter(route => route.language === language);
      for (const entry of CODEX_ENTRIES) expect(routes.filter(route => route.page.kind === 'codexEntry' && route.page.id === entry.id), entry.id).toHaveLength(1);
      for (const section of CODEX_SECTIONS) expect(routes.filter(route => route.page.kind === 'codexSection' && route.page.section === section), section).toHaveLength(1);
      for (const { id } of CODEX_PAGES) expect(routes.filter(route => route.page.kind === 'rules' && route.page.id === id), id).toHaveLength(1);
    }
  });

  it('never gives two pages the same path', () => {
    const paths = GUIDE_ROUTES.map(route => route.path);
    expect(new Set(paths).size).toBe(paths.length);
  });

  it('keeps paths readable', () => {
    for (const { path } of GUIDE_ROUTES) expect(path).toMatch(/^([a-z0-9-]+\/)*$/);
  });
});
