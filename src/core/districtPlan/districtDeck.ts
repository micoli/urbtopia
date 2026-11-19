import { hashSeed, nextRandom } from '../engine/random';
import { DISTRICT_PLAN } from './districtPlanBalance';
import { bestScoreOf } from './districtSolver';
import { HEX_CATEGORIES, type HexCategory } from './districtPlanVocabulary';
import type { Hex } from './hex';
import { EDGE_COUNT } from './hexGrid';

// A Deck that no search can bring to Gold is drawn again, with the next attempt number, until one can.
const MAX_ATTEMPTS = 100;
const MAX_CACHED_DECKS = 32;

export const deckSizeOf = (tier: number): number => DISTRICT_PLAN.deckSizes[Math.min(tier, DISTRICT_PLAN.deckSizes.length) - 1]!;

const drawDeck = (seed: string, size: number): Hex[] => {
  let rngState = hashSeed(seed);
  const draw = (count: number): number => {
    const drawn = nextRandom(rngState);
    rngState = drawn.rngState;
    return Math.floor(drawn.value * count);
  };
  const drawCategory = (excluded?: HexCategory): HexCategory => {
    const allowed = HEX_CATEGORIES.filter(category => category !== excluded);
    let remaining = (draw(1_000_000) / 1_000_000) * allowed.reduce((sum, category) => sum + DISTRICT_PLAN.categoryWeights[category], 0);
    for (const category of allowed) {
      remaining -= DISTRICT_PLAN.categoryWeights[category];
      if (remaining < 0) return category;
    }
    return allowed[allowed.length - 1]!;
  };

  return Array.from({ length: size }, () => {
    const majority = drawCategory();
    const minority = drawCategory(majority);
    const minorEdges = DISTRICT_PLAN.minorEdgeCounts[draw(DISTRICT_PLAN.minorEdgeCounts.length)]!;
    const start = draw(EDGE_COUNT);
    const edges = Array.from({ length: EDGE_COUNT }, (_, edge) => ((edge - start + EDGE_COUNT) % EDGE_COUNT < minorEdges ? minority : majority));
    return { edges };
  });
};

const decks = new Map<string, Hex[]>();

// The Deck of an office: every game of the office plays the same one, so a better score comes from better placements and not from a better draw. It is one that can reach Gold: the first draw, at attempt 0, comes from `${seed}:district-plan:${officeId}:1`, and a draw that cannot reach Gold gives way to the next attempt.
export const deckOf = (seed: string, officeId: number, size: number): Hex[] => {
  const key = `${seed}|${officeId}|${size}`;
  const known = decks.get(key);
  if (known) return known;
  const gold = DISTRICT_PLAN.rankScorePerHex.gold * size;
  const base = `${seed}:district-plan:${officeId}:1`;
  let deck = drawDeck(base, size);
  for (let attempt = 1; attempt < MAX_ATTEMPTS && bestScoreOf(deck) < gold; attempt++) deck = drawDeck(`${base}:${attempt}`, size);
  if (decks.size >= MAX_CACHED_DECKS) decks.clear();
  decks.set(key, deck);
  return deck;
};
