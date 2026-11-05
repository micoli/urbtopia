import { searchMatch } from '../../codex/matchesSearch';
import type { SearchItem } from './searchIndex';

const MAX_RESULTS = 20;

// Exact title, exact text, then the same two with typos forgiven.
function rankOf(item: SearchItem, query: string): number | null {
  const title = searchMatch(item.title, query);
  const text = searchMatch(`${item.title} ${item.summary} ${item.section}`, query);
  if (title === 'exact') return 0;
  if (text === 'exact') return 1;
  if (title === 'fuzzy') return 2;
  if (text === 'fuzzy') return 3;
  return null;
}

export function searchResults(items: readonly SearchItem[], query: string): SearchItem[] {
  if (query.trim() === '') return [];
  return items
    .flatMap(item => {
      const rank = rankOf(item, query);
      return rank === null ? [] : [{ item, rank }];
    })
    .sort((a, b) => a.rank - b.rank)
    .slice(0, MAX_RESULTS)
    .map(({ item }) => item);
}
