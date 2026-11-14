import { editDistance, normalized, wordsOf } from './matchesSearch';

export interface SearchableDocument {
  title: string;
  summary?: string;
  section?: string;
  // Words the page shows in figures rather than sentences: they weigh like the summary.
  keywords?: string;
  body?: string;
}

const MIN_BODY_TERM_LENGTH = 3;
const MIN_FUZZY_LENGTH = 5;
const MIN_FUZZY_PREFIX_LENGTH = 6;
const LONG_TERM_LENGTH = 8;

interface FieldWeights {
  word: number;
  prefix: number;
  fuzzy: number;
}

const TITLE: FieldWeights = { word: 10, prefix: 8, fuzzy: 3 };
const SUMMARY: FieldWeights = { word: 5, prefix: 4, fuzzy: 1.5 };
const KEYWORDS: FieldWeights = { word: 6, prefix: 5.5, fuzzy: 0 };
const SECTION: FieldWeights = { word: 3, prefix: 2, fuzzy: 0 };
const BODY: FieldWeights = { word: 1, prefix: 0.6, fuzzy: 0 };

const allowedErrorsOf = (term: string): number => (term.length < MIN_FUZZY_LENGTH ? 0 : term.length < LONG_TERM_LENGTH ? 1 : 2);

function isFuzzyMatch(term: string, word: string): boolean {
  const limit = allowedErrorsOf(term);
  if (limit === 0) return false;
  if (editDistance(term, word, limit) <= limit) return true;
  return term.length >= MIN_FUZZY_PREFIX_LENGTH && word.length > term.length && editDistance(term, word.slice(0, term.length), limit) <= limit;
}

function scoreInField(term: string, words: readonly string[], weights: FieldWeights): number {
  let best = 0;
  for (const word of words) {
    if (word === term) return weights.word;
    if (word.startsWith(term)) best = Math.max(best, weights.prefix);
    else if (weights.fuzzy > best && isFuzzyMatch(term, word)) best = weights.fuzzy;
  }
  return best;
}

interface IndexedDocument {
  title: string[];
  summary: string[];
  keywords: string[];
  section: string[];
  body: string[];
}

const wordsOfText = (text: string | undefined): string[] => wordsOf(normalized(text ?? ''));

const indexOf = (document: SearchableDocument): IndexedDocument => ({
  title: wordsOfText(document.title),
  summary: wordsOfText(document.summary),
  keywords: [...new Set(wordsOfText(document.keywords))],
  section: wordsOfText(document.section),
  body: [...new Set(wordsOfText(document.body))],
});

function scoreOfTerm(term: string, indexed: IndexedDocument): number {
  const headScore = Math.max(scoreInField(term, indexed.title, TITLE), scoreInField(term, indexed.summary, SUMMARY), scoreInField(term, indexed.keywords, KEYWORDS), scoreInField(term, indexed.section, SECTION));
  if (headScore > 0 || term.length < MIN_BODY_TERM_LENGTH) return headScore;
  return scoreInField(term, indexed.body, BODY);
}

// Whole words and word starts only, so "port" never finds "support". Typos are forgiven in titles and summaries, never in the body text.
function scoreOfIndexed(indexed: IndexedDocument, query: string): number | null {
  const terms = wordsOf(normalized(query));
  if (terms.length === 0) return 0;
  let total = 0;
  for (const term of terms) {
    const score = scoreOfTerm(term, indexed);
    if (score === 0) return null;
    total += score;
  }
  return total;
}

export const documentScore = (document: SearchableDocument, query: string): number | null => scoreOfIndexed(indexOf(document), query);

const indexes = new WeakMap<object, IndexedDocument>();

function cachedIndexOf(item: object, documentOf: () => SearchableDocument): IndexedDocument {
  const known = indexes.get(item);
  if (known) return known;
  const created = indexOf(documentOf());
  indexes.set(item, created);
  return created;
}

export function rankDocuments<T extends object>(items: readonly T[], documentOf: (item: T) => SearchableDocument, query: string): T[] {
  return items
    .flatMap(item => {
      const score = scoreOfIndexed(cachedIndexOf(item, () => documentOf(item)), query);
      return score === null ? [] : [{ item, score }];
    })
    .sort((a, b) => b.score - a.score)
    .map(({ item }) => item);
}
