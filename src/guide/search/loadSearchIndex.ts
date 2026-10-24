import type { Language } from '../../i18n/prefsStore';
import type { SearchItem } from './searchIndex';

const loaded = new Map<string, Promise<SearchItem[]>>();

async function fetched(url: string, language: Language): Promise<SearchItem[]> {
  if (import.meta.env.DEV) return (await import('./searchIndex')).searchIndexOf(language);
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Search index: ${response.status}`);
  return response.json() as Promise<SearchItem[]>;
}

export function loadSearchIndex(docsRoot: string, language: Language): Promise<SearchItem[]> {
  const url = `${docsRoot}${language}/search.json`;
  const pending = loaded.get(url) ?? fetched(url, language);
  loaded.set(url, pending);
  pending.catch(() => loaded.delete(url));
  return pending;
}
