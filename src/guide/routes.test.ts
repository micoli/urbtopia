import { describe, expect, it } from 'vitest';
import { docsRootOf, gameRootOf, guideRouteOf, hrefOf, translatedPathOf } from './routes';

describe('guideRouteOf', () => {
  it('finds a page whatever sub-path the site is served from', () => {
    expect(guideRouteOf('/urbtopia/docs/fr/codex/buildings/home/').page).toEqual({ kind: 'codexEntry', id: 'home' });
    expect(guideRouteOf('/docs/fr/codex/buildings/home/index.html').language).toBe('fr');
    expect(guideRouteOf('/docs/en').page).toEqual({ kind: 'home' });
  });

  it('falls back to the language choice for the root and unknown pages', () => {
    expect(guideRouteOf('/docs/').page.kind).toBe('languageChoice');
    expect(guideRouteOf('/docs/en/nowhere/').page.kind).toBe('languageChoice');
  });
});

describe('relative links', () => {
  it('climb back to the Guide and the game from a nested page', () => {
    const route = guideRouteOf('/docs/en/codex/buildings/home/');
    expect(docsRootOf(route)).toBe('../../../../');
    expect(gameRootOf(route)).toBe('../../../../../');
    expect(hrefOf(route, 'fr/')).toBe('../../../../fr/');
    expect(hrefOf(guideRouteOf('/docs/'), '')).toBe('./');
  });
});

describe('translatedPathOf', () => {
  it('keeps the page and swaps the language', () => {
    expect(translatedPathOf(guideRouteOf('/docs/en/codex/buildings/home/'), 'fr')).toBe('fr/codex/buildings/home/');
    expect(translatedPathOf(guideRouteOf('/docs/fr/'), 'en')).toBe('en/');
  });
});
