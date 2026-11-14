import { useEffect, useState } from 'react';
import { CODEX_ENTRIES } from '../../codex/catalog';
import { messageIn } from '../../advisor/messageIn';
import type { MessageKey } from '../../i18n/messages';
import type { Language } from '../../i18n/prefsStore';
import { ARTICLE_DIRECTORIES, type Article } from '../../guide/content/articles';
import { plainTextOfArticle } from '../../guide/content/articleText';

const articleSources = import.meta.glob<string>('../../guide/content/*/*.mdx', { query: '?raw', import: 'default' });

const pathOf = (article: Article, language: Language): string => `../../guide/content/${ARTICLE_DIRECTORIES[article.section]}/${article.slug}.${language}.mdx`;

export type ArticleBodies = ReadonlyMap<Article, string>;

async function loadBodies(articles: readonly Article[], language: Language): Promise<ArticleBodies> {
  const nameOfEntry = (id: string) => {
    const entry = CODEX_ENTRIES.find(item => item.id === id);
    return entry ? messageIn(language, entry.name as MessageKey) : id;
  };
  const bodies = await Promise.all(articles.map(async (article): Promise<[Article, string]> => {
    const load = articleSources[pathOf(article, language)] ?? articleSources[pathOf(article, 'en')];
    return [article, load ? plainTextOfArticle(await load(), nameOfEntry) : ''];
  }));
  return new Map(bodies);
}

// Loaded once the player starts searching, so the article texts stay out of the way until then.
export function useArticleBodies(articles: readonly Article[], language: Language, enabled: boolean): ArticleBodies {
  const [bodies, setBodies] = useState<ArticleBodies>(new Map());
  useEffect(() => {
    if (!enabled || bodies.size > 0) return;
    let cancelled = false;
    loadBodies(articles, language).then(loaded => { if (!cancelled) setBodies(loaded); }, () => undefined);
    return () => { cancelled = true; };
  }, [enabled, bodies.size, articles, language]);
  return bodies;
}
