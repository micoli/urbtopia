import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ARTICLES, translationOf } from '../../guide/content/articles';
import { prefsStore } from '../../i18n/prefsStore';
import { ARTICLE_GROUPS, CodexArticleNav } from './CodexArticleNav';

vi.mock('../common/hooks', () => ({ useGame: () => ({}), useUi: () => ({}) }));

afterEach(() => prefsStore.getState().setLanguage('en'));

describe('CodexArticleNav', () => {
  it('has a group for every section of the Guide articles', () => {
    expect(ARTICLES.every(article => ARTICLE_GROUPS.some(group => group.id === article.section))).toBe(true);
  });

  it.each(['en', 'fr'] as const)('lists every Guide article of the game Codex in %s', language => {
    prefsStore.getState().setLanguage(language);
    const html = renderToStaticMarkup(<CodexArticleNav idPrefix="nav" articles={ARTICLES} language={language} current={null} forceOpen openGroup="" onToggle={() => undefined} onChoose={() => undefined} />).replaceAll('&#x27;', "'");
    for (const article of ARTICLES) expect(html).toContain(translationOf(article, language).meta.title);
  });
});
