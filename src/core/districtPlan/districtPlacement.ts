import { DISTRICT_PLAN } from './districtPlanBalance';
import type { PlacedHex } from './districtScore';
import { CENTRE, cellKey, distanceBetween, neighboursOf, type Cell } from './hexGrid';

// A cell is open to a Hex when it is free, within the radius of the board, and touches a cell already taken.
export const isCellPlaceable = (taken: readonly Cell[], cell: Cell): boolean => {
  if (distanceBetween(CENTRE, cell) > DISTRICT_PLAN.boardRadius) return false;
  const takenKeys = new Set(taken.map(cellKey));
  if (takenKeys.has(cellKey(cell))) return false;
  return neighboursOf(cell).some(neighbour => takenKeys.has(cellKey(neighbour)));
};

export const isPlacementValid = (placed: readonly PlacedHex[], cell: Cell): boolean => isCellPlaceable(placed.map(item => item.cell), cell);
