import type { Article } from '../guide/content/articles';
import { CODEX_ENTRIES, type CodexId } from './catalog';
import { CODEX_PAGES, type CodexPage } from './pages';

export type FavoriteTarget =
  | { kind: 'entry'; id: CodexId }
  | { kind: 'page'; id: CodexPage }
  | { kind: 'article'; article: Article };

export function favoriteKeyOf(target: FavoriteTarget): string {
  if (target.kind === 'article') return `article:${target.article.section}/${target.article.slug}`;
  return `${target.kind}:${target.id}`;
}

export function favoriteTargetOf(key: string, articles: readonly Article[]): FavoriteTarget | null {
  const separator = key.indexOf(':');
  const kind = key.slice(0, separator);
  const id = key.slice(separator + 1);
  if (kind === 'entry') return CODEX_ENTRIES.some(entry => entry.id === id) ? { kind, id: id as CodexId } : null;
  if (kind === 'page') return CODEX_PAGES.some(page => page.id === id) ? { kind, id: id as CodexPage } : null;
  if (kind !== 'article') return null;
  const article = articles.find(item => `${item.section}/${item.slug}` === id);
  return article ? { kind, article } : null;
}
