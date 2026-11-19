import { DISTRICT_PLAN } from './districtPlanBalance';
import type { HexCategory } from './districtPlanVocabulary';
import type { Hex } from './hex';
import { cellKey, neighbourOf, oppositeEdge, type Cell } from './hexGrid';

export interface PlacedHex {
  readonly cell: Cell;
  readonly hex: Hex;
}

// Looking only east, north-east and north-west from each Hex visits every touching pair once.
const EDGES_COUNTED = [0, 1, 2];

const pairKey = (a: string, b: string): string => (a < b ? `${a}|${b}` : `${b}|${a}`);

const PAIR_SCORES = new Map(DISTRICT_PLAN.pairScores.map(({ between, score }) => [pairKey(between[0]!, between[1]!), score]));

export const pairScoreOf = (a: HexCategory, b: HexCategory): number => (a === b ? DISTRICT_PLAN.sameCategoryScore : (PAIR_SCORES.get(pairKey(a, b)) ?? 0));

export const scoreOf = (placed: readonly PlacedHex[]): number => {
  const byCell = new Map(placed.map(item => [cellKey(item.cell), item]));
  let total = 0;
  for (const { cell, hex } of placed) {
    for (const edge of EDGES_COUNTED) {
      const neighbour = byCell.get(cellKey(neighbourOf(cell, edge)));
      if (!neighbour) continue;
      total += pairScoreOf(hex.edges[edge]!, neighbour.hex.edges[oppositeEdge(edge)]!);
    }
  }
  return total;
};
