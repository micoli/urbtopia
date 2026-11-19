import { DISTRICT_PLAN } from './districtPlanBalance';
import type { PlacedHex } from './districtScore';
import { CENTRE, cellKey, distanceBetween, neighboursOf, type Cell } from './hexGrid';

export const isPlacementValid = (placed: readonly PlacedHex[], cell: Cell): boolean => {
  if (distanceBetween(CENTRE, cell) > DISTRICT_PLAN.boardRadius) return false;
  const taken = new Set(placed.map(item => cellKey(item.cell)));
  if (taken.has(cellKey(cell))) return false;
  return neighboursOf(cell).some(neighbour => taken.has(cellKey(neighbour)));
};
