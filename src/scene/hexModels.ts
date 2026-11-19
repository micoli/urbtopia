import type { HexCategory } from '../core';

// Where a model stands, from the centre of the Hex, and how wide it is drawn, in the same units as the circumradius of the Hex.
export interface ModelSlot {
  category: HexCategory;
  x: number;
  z: number;
  extent: number;
}

const WEDGE_REACH = 0.55;
const SMALLEST_EXTENT = 0.24;
const EXTENT_PER_EDGE = 0.12;
const LARGEST_EXTENT = 0.72;

// One model per category present on the Hex, standing at the middle of the edges of that category: in the heart of the Hex when it has them all around, nearer the rim when it has a few, and drawn wider as it has more edges.
export const modelSlotsOf = (edges: readonly HexCategory[], size: number): ModelSlot[] => {
  const categories = [...new Set(edges)];
  return categories.map(category => {
    const own = edges.flatMap((edge, index) => (edge === category ? [index] : []));
    const x = own.reduce((sum, index) => sum + Math.cos((index * Math.PI) / 3), 0) / own.length;
    const z = own.reduce((sum, index) => sum - Math.sin((index * Math.PI) / 3), 0) / own.length;
    return { category, x: x * WEDGE_REACH * size + 0, z: z * WEDGE_REACH * size + 0, extent: Math.min(LARGEST_EXTENT, SMALLEST_EXTENT + EXTENT_PER_EDGE * own.length) * size };
  });
};
