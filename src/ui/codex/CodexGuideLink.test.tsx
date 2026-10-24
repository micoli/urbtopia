import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { CODEX_ENTRIES } from '../../codex/catalog';
import { GUIDE_ROUTES } from '../../guide/routes';
import { prefsStore } from '../../i18n/prefsStore';
import { CodexGuideLink } from './CodexGuideLink';

const hrefOf = (html: string): string => /href="[^"]*docs\/([^"]*)"/.exec(html)![1]!;

describe('CodexGuideLink', () => {
  it('opens the Guide page of the entry or rule page, in the player language', () => {
    prefsStore.setState({ language: 'fr' });
    const home = CODEX_ENTRIES.find(entry => entry.id === 'home')!;
    expect(hrefOf(renderToStaticMarkup(<CodexGuideLink entry={home} page={null} />))).toBe('fr/codex/housing/home/');
    expect(hrefOf(renderToStaticMarkup(<CodexGuideLink entry={home} page="energy" />))).toBe('fr/mechanics/energy/');
  });

  it('always points to a page the Guide publishes', () => {
    const paths = new Set(GUIDE_ROUTES.map(route => route.path));
    for (const entry of CODEX_ENTRIES) expect(paths.has(hrefOf(renderToStaticMarkup(<CodexGuideLink entry={entry} page={null} />))), entry.id).toBe(true);
  });
});
