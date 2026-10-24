import { matchesSearch } from '../../codex/matchesSearch';
import type { SearchItem } from './searchIndex';

const MAX_RESULTS = 20;

export function searchResults(items: readonly SearchItem[], query: string): SearchItem[] {
  if (query.trim() === '') return [];
  const byTitle = items.filter(item => matchesSearch(item.title, query));
  const byText = items.filter(item => !byTitle.includes(item) && matchesSearch(`${item.title} ${item.summary} ${item.section}`, query));
  return [...byTitle, ...byText].slice(0, MAX_RESULTS);
}
