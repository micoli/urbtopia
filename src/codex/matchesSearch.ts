const MIN_FUZZY_LENGTH = 4;
const LONG_TERM_LENGTH = 8;

export type SearchMatch = 'exact' | 'fuzzy';

export const normalized = (text: string): string => text.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’'`]/g, '').toLocaleLowerCase();

export const wordsOf = (text: string): string[] => text.split(/[^\p{L}\p{N}]+/u).filter(Boolean);

const allowedErrorsOf = (term: string): number => {
  if (term.length < MIN_FUZZY_LENGTH) return 0;
  return term.length < LONG_TERM_LENGTH ? 1 : 2;
};

// Optimal string alignment distance: a swap of two neighbouring letters counts for one error.
function editDistance(a: string, b: string, limit: number): number {
  if (Math.abs(a.length - b.length) > limit) return limit + 1;
  const rows: number[][] = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array<number>(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) rows[0]![j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      rows[i]![j] = Math.min(rows[i - 1]![j]! + 1, rows[i]![j - 1]! + 1, rows[i - 1]![j - 1]! + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) rows[i]![j] = Math.min(rows[i]![j]!, rows[i - 2]![j - 2]! + 1);
    }
  }
  return rows[a.length]![b.length]!;
}

// A typed term is close to a word when it is close to the word itself or to the start of it, so a half-typed misspelling still matches.
function isCloseToWord(term: string, word: string): boolean {
  const limit = allowedErrorsOf(term);
  if (limit === 0) return false;
  if (editDistance(term, word, limit) <= limit) return true;
  return word.length > term.length && editDistance(term, word.slice(0, term.length), limit) <= limit;
}

function termMatch(term: string, value: string, words: readonly string[]): SearchMatch | null {
  if (value.includes(term)) return 'exact';
  return words.some(word => isCloseToWord(term, word)) ? 'fuzzy' : null;
}

// Ignores case, accents and apostrophes, and forgives a few typos in the longer words.
export function searchMatch(value: string, query: string): SearchMatch | null {
  const terms = wordsOf(normalized(query));
  if (terms.length === 0) return 'exact';
  const text = normalized(value);
  const words = wordsOf(text);
  const matches = terms.map(term => termMatch(term, text, words));
  if (matches.includes(null)) return null;
  return matches.includes('fuzzy') ? 'fuzzy' : 'exact';
}

export const matchesSearch = (value: string, query: string): boolean => searchMatch(value, query) !== null;
