import { EDGE_COUNT } from './hexGrid';
import type { HexCategory } from './districtPlanVocabulary';

export interface Hex {
  readonly edges: readonly HexCategory[];
}

const MAX_CATEGORIES_PER_HEX = 2;

export const isHexValid = (hex: Hex): boolean => hex.edges.length === EDGE_COUNT && new Set(hex.edges).size <= MAX_CATEGORIES_PER_HEX;

// One turn is 60° counter-clockwise: the edge that faced east now faces north-east.
export const rotateHex = (hex: Hex, turns: number): Hex => {
  const offset = ((turns % EDGE_COUNT) + EDGE_COUNT) % EDGE_COUNT;
  return { edges: hex.edges.map((_, edge) => hex.edges[(edge - offset + EDGE_COUNT) % EDGE_COUNT]!) };
};
