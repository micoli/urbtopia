import { describe, expect, it } from 'vitest';
import { ARTICLES, articlesOf, isTranslated, translationOf } from './articles';

const page = (title: string, order = 1) => ({ default: () => null, meta: { title, summary: '', order } });

describe('articlesOf', () => {
  it('groups the languages of a page and falls back to English', () => {
    const [article] = articlesOf({ './glossary/index.en.mdx': page('Glossary') });
    expect(article!.section).toBe('glossary');
    expect(isTranslated(article!, 'fr')).toBe(false);
    expect(translationOf(article!, 'fr').meta.title).toBe('Glossary');
  });

  it('refuses a page without English version or outside the known sections', () => {
    expect(() => articlesOf({ './glossary/index.fr.mdx': page('Glossaire') })).toThrow(/English/);
    expect(() => articlesOf({ './recipes/index.en.mdx': page('Recipes') })).toThrow(/directory/);
  });

  it('orders the pages by their declared order', () => {
    expect(articlesOf({ './glossary/index.en.mdx': page('B', 2), './getting-started/index.en.mdx': page('A', 1) }).map(article => article.section)).toEqual(['gettingStarted', 'glossary']);
  });
});

describe('Guide articles', () => {
  it('include the Getting started and Glossary pages', () => {
    expect(ARTICLES.map(article => article.section)).toEqual(expect.arrayContaining(['gettingStarted', 'glossary']));
  });
});
