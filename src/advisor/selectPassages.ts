import { normalized, wordsOf } from '../codex/matchesSearch';
import type { RulesPassage } from './rulesPassages';

const MAX_PASSAGES = 2;
const MAX_PASSAGE_CHARACTERS = 900;
const MIN_TERM_LENGTH = 3;
const MAX_COUNTED_HITS = 3;
const TITLE_HIT_WEIGHT = 3;
const RARE_WORD_DOCUMENTS = 12;
const RARE_WORD_SHARE = 0.05;

const STOP_WORDS = new Set(
  ('the and for are how what why when does did can you your with from that this there their have has not but all any per into than then them they will would should could about which where who whom ' +
    'les des une que qui quoi dans pour par sur avec sans est sont comment pourquoi quand quel quelle quels quelles aux ces ses mes mon ton son nos vos leur leurs pas plus tout tous fait faire dois peut peux ' +
    'ville city work works does make get use')
    .split(' '),
);

const stemOf = (term: string): string => {
  const singular = term.replace(/[sx]$/, '');
  return singular.length >= 7 ? singular.slice(0, -2) : singular;
};

const wordsOfText = (text: string): string[] => wordsOf(normalized(text.replace(/[’']/g, ' ')));

const termsOf = (question: string): string[] => [...new Set(wordsOfText(question).filter((word) => word.length >= MIN_TERM_LENGTH && !STOP_WORDS.has(word)).map(stemOf))];

const startingWith = (words: readonly string[], stem: string): number => words.filter((word) => word.startsWith(stem)).length;

interface IndexedPassage {
  passage: RulesPassage;
  titleWords: string[];
  textWords: string[];
}

const indexed = new WeakMap<RulesPassage, IndexedPassage>();

const indexOf = (passage: RulesPassage): IndexedPassage => {
  const known = indexed.get(passage);
  if (known) return known;
  const entry = { passage, titleWords: wordsOfText(passage.title), textWords: wordsOfText(passage.text) };
  indexed.set(passage, entry);
  return entry;
};

// A rare word says more about the topic than a common one, and a word found nowhere in the rules is ignored.
interface TermWeight {
  weight: number;
  rare: boolean;
}

function weightsOf(entries: readonly IndexedPassage[], stems: readonly string[]): Map<string, TermWeight> {
  const weights = new Map<string, TermWeight>();
  for (const stem of stems) {
    const documents = entries.filter(({ titleWords, textWords }) => startingWith(titleWords, stem) > 0 || startingWith(textWords, stem) > 0).length;
    if (documents > 0) weights.set(stem, { weight: Math.log(1 + entries.length / documents), rare: documents <= Math.min(RARE_WORD_DOCUMENTS, entries.length * RARE_WORD_SHARE) });
  }
  return weights;
}

function scoreOf({ titleWords, textWords }: IndexedPassage, weights: ReadonlyMap<string, TermWeight>): { score: number; matched: number; matchedRare: boolean } {
  let score = 0;
  let matched = 0;
  let matchedRare = false;
  for (const [stem, { weight, rare }] of weights) {
    const inTitle = startingWith(titleWords, stem) > 0;
    const inText = Math.min(startingWith(textWords, stem), MAX_COUNTED_HITS);
    if (!inTitle && inText === 0) continue;
    matched += 1;
    matchedRare ||= rare;
    score += weight * ((inTitle ? TITLE_HIT_WEIGHT : 0) + inText);
  }
  return { score, matched, matchedRare };
}

function shortened(text: string): string {
  if (text.length <= MAX_PASSAGE_CHARACTERS) return text;
  const cut = text.slice(0, MAX_PASSAGE_CHARACTERS);
  const lastBreak = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('\n'));
  return lastBreak > MAX_PASSAGE_CHARACTERS / 2 ? cut.slice(0, lastBreak + 1) : cut;
}

// One common word alone does not drag in an unrelated rule: a passage needs two of the question's words, or one rare enough to name its topic.
export function selectPassages(passages: readonly RulesPassage[], question: string): RulesPassage[] {
  const entries = passages.map(indexOf);
  const weights = weightsOf(entries, termsOf(question));
  if (weights.size === 0) return [];
  const required = Math.min(2, weights.size);
  return entries
    .map((entry) => ({ passage: entry.passage, ...scoreOf(entry, weights) }))
    .filter(({ matched, matchedRare }) => matched >= required || matchedRare)
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_PASSAGES)
    .map(({ passage }) => ({ title: passage.title, text: shortened(passage.text) }));
}

const CITY_MARKERS = new Set(['my', 'our', 'mine', 'mon', 'ma', 'mes', 'notre', 'nos', 'ville', 'city', 'problem', 'probleme', 'first', 'premier']);

export function isAboutCity(question: string): boolean {
  return wordsOfText(question).some((word) => CITY_MARKERS.has(word));
}
