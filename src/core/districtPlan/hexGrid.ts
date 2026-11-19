export interface Cell {
  readonly q: number;
  readonly r: number;
}

export const EDGE_COUNT = 6;

// Edge 0 faces east, then the edges go round counter-clockwise in steps of 60°.
const DIRECTIONS: readonly Cell[] = [
  { q: 1, r: 0 },
  { q: 1, r: -1 },
  { q: 0, r: -1 },
  { q: -1, r: 0 },
  { q: -1, r: 1 },
  { q: 0, r: 1 },
];

export const cellKey = (cell: Cell): string => `${cell.q},${cell.r}`;

export const oppositeEdge = (edge: number): number => (edge + EDGE_COUNT / 2) % EDGE_COUNT;

export const neighbourOf = (cell: Cell, edge: number): Cell => {
  const direction = DIRECTIONS[edge]!;
  return { q: cell.q + direction.q, r: cell.r + direction.r };
};

export const neighboursOf = (cell: Cell): Cell[] => DIRECTIONS.map((_, edge) => neighbourOf(cell, edge));

export const distanceBetween = (a: Cell, b: Cell): number => {
  const dq = a.q - b.q;
  const dr = a.r - b.r;
  return (Math.abs(dq) + Math.abs(dr) + Math.abs(dq + dr)) / 2;
};

export const cellsOfBoard = (radius: number): Cell[] => {
  const cells: Cell[] = [];
  for (let q = -radius; q <= radius; q++) {
    for (let r = Math.max(-radius, -q - radius); r <= Math.min(radius, -q + radius); r++) cells.push({ q, r });
  }
  return cells;
};
