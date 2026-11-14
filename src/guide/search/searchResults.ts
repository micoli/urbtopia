import { rankDocuments } from '../../codex/documentSearch';
import type { SearchItem } from './searchIndex';

const MAX_RESULTS = 20;

export function searchResults(items: readonly SearchItem[], query: string): SearchItem[] {
  if (query.trim() === '') return [];
  return rankDocuments(items, item => item, query).slice(0, MAX_RESULTS);
}
