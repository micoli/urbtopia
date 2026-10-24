import type { MDXContent } from 'mdx/types';
import type { Language } from '../../i18n/prefsStore';

export type ArticleSection = 'gettingStarted' | 'mechanics' | 'glossary';

export interface ArticleMeta {
  title: string;
  summary: string;
  order: number;
}

interface ArticleModule {
  default: MDXContent;
  meta: ArticleMeta;
}

export interface Article {
  section: ArticleSection;
  slug: string;
  translations: Partial<Record<Language, ArticleModule>>;
}

export const ARTICLE_DIRECTORIES: Record<ArticleSection, string> = { gettingStarted: 'getting-started', mechanics: 'mechanics', glossary: 'glossary' };

const sectionOfDirectory = (directory: string): ArticleSection => {
  const section = (Object.keys(ARTICLE_DIRECTORIES) as ArticleSection[]).find(key => ARTICLE_DIRECTORIES[key] === directory);
  if (!section) throw new Error(`Unknown Guide article directory: ${directory}`);
  return section;
};

export function articlesOf(modules: Record<string, ArticleModule>): Article[] {
  const articles = new Map<string, Article>();
  for (const [file, module] of Object.entries(modules)) {
    const match = /^\.\/([a-z-]+)\/([a-z0-9-]+)\.(en|fr)\.mdx$/.exec(file);
    if (!match) throw new Error(`Guide article must be <section>/<slug>.<en|fr>.mdx: ${file}`);
    const [, directory, slug, language] = match as unknown as [string, string, string, Language];
    const key = `${directory}/${slug}`;
    const article = articles.get(key) ?? { section: sectionOfDirectory(directory), slug, translations: {} };
    article.translations[language] = module;
    articles.set(key, article);
  }
  for (const [key, article] of articles) if (!article.translations.en) throw new Error(`Guide article without English version: ${key}`);
  return [...articles.values()].sort((a, b) => a.translations.en!.meta.order - b.translations.en!.meta.order);
}

export const ARTICLES: readonly Article[] = articlesOf(import.meta.glob<ArticleModule>('./*/*.mdx', { eager: true }));

export const translationOf = (article: Article, language: Language): ArticleModule => article.translations[language] ?? article.translations.en!;

export const isTranslated = (article: Article, language: Language): boolean => article.translations[language] !== undefined;
