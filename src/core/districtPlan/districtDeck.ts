import { hashSeed, nextRandom } from '../engine/random';
import { DISTRICT_PLAN } from './districtPlanBalance';
import { HEX_CATEGORIES } from './districtPlanVocabulary';
import type { Hex } from './hex';
import { EDGE_COUNT } from './hexGrid';

export const deckSizeOf = (tier: number): number => DISTRICT_PLAN.deckSizes[Math.min(tier, DISTRICT_PLAN.deckSizes.length) - 1]!;

// The Deck of a game: the same for the same Seed, office and game number, and not the same for another game.
export const deckOf = (seed: string, officeId: number, gameNumber: number, size: number): Hex[] => {
  let rngState = hashSeed(`${seed}:district-plan:${officeId}:${gameNumber}`);
  const draw = (count: number): number => {
    const drawn = nextRandom(rngState);
    rngState = drawn.rngState;
    return Math.floor(drawn.value * count);
  };

  return Array.from({ length: size }, () => {
    const majority = HEX_CATEGORIES[draw(HEX_CATEGORIES.length)]!;
    const others = HEX_CATEGORIES.filter(category => category !== majority);
    const minority = others[draw(others.length)]!;
    const minorEdges = DISTRICT_PLAN.minorEdgeCounts[draw(DISTRICT_PLAN.minorEdgeCounts.length)]!;
    const start = draw(EDGE_COUNT);
    const edges = Array.from({ length: EDGE_COUNT }, (_, edge) => ((edge - start + EDGE_COUNT) % EDGE_COUNT < minorEdges ? minority : majority));
    return { edges };
  });
};
