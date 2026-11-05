import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { CODEX_ENTRIES } from '../../codex/catalog';
import { ARTICLES } from '../../guide/content/articles';
import { GUIDE_ROUTES } from '../../guide/routes';
import { prefsStore } from '../../i18n/prefsStore';
import { CodexGuideLink } from './CodexGuideLink';

const hrefOf = (html: string): string => /href="[^"]*docs\/([^"]*)"/.exec(html)![1]!;

describe('CodexGuideLink', () => {
  it('opens the Guide page of the entry or rule page, in the player language', () => {
    prefsStore.setState({ language: 'fr' });
    const home = CODEX_ENTRIES.find(entry => entry.id === 'home')!;
    expect(hrefOf(renderToStaticMarkup(<CodexGuideLink entry={home} page={null} article={null} />))).toBe('fr/codex/housing/home/');
    expect(hrefOf(renderToStaticMarkup(<CodexGuideLink entry={home} page="costs" article={null} />))).toBe('fr/mechanics/costs/');
  });

  it('opens the Guide page of an article', () => {
    prefsStore.setState({ language: 'en' });
    const home = CODEX_ENTRIES.find(entry => entry.id === 'home')!;
    const tourism = ARTICLES.find(article => article.slug === 'tourism')!;
    expect(hrefOf(renderToStaticMarkup(<CodexGuideLink entry={home} page={null} article={tourism} />))).toBe('en/mechanics/tourism/');
  });

  it('always points to a page the Guide publishes', () => {
    const paths = new Set(GUIDE_ROUTES.map(route => route.path));
    for (const entry of CODEX_ENTRIES) expect(paths.has(hrefOf(renderToStaticMarkup(<CodexGuideLink entry={entry} page={null} article={null} />))), entry.id).toBe(true);
  });
});
