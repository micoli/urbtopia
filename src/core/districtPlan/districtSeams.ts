import type { PlacedHex } from './districtScore';
import { cellKey, neighbourOf, oppositeEdge, type Cell } from './hexGrid';

// The seam between a Hex and its neighbour across one of its edges.
export interface Seam {
  readonly cell: Cell;
  readonly edge: number;
}

// Looking only east, north-east and north-west from each Hex visits every touching pair once, as the score does.
const EDGES_SEEN = [0, 1, 2];

// The seams where the two edges that touch are of the same category.
export const matchingSeams = (placed: readonly PlacedHex[]): Seam[] => {
  const byCell = new Map(placed.map(item => [cellKey(item.cell), item]));
  return placed.flatMap(({ cell, hex }) =>
    EDGES_SEEN.flatMap(edge => {
      const neighbour = byCell.get(cellKey(neighbourOf(cell, edge)));
      return neighbour && neighbour.hex.edges[oppositeEdge(edge)] === hex.edges[edge] ? [{ cell, edge }] : [];
    }),
  );
};

// The seams of a Hex with its neighbours, from either side.
export const seamsAround = (seams: readonly Seam[], cell: Cell): Seam[] =>
  seams.filter(seam => cellKey(seam.cell) === cellKey(cell) || cellKey(neighbourOf(seam.cell, seam.edge)) === cellKey(cell));
