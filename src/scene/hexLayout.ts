import { HEX_EDGE_COUNT, type Cell } from '../core';

const SQRT3 = Math.sqrt(3);

export interface Point {
  readonly x: number;
  readonly z: number;
}

// Pointy-top hexagons of circumradius `size`: x runs east and z south, so edge 0 faces east and the edges go round counter-clockwise, north on the screen being -z.
export const cellToPoint = (cell: Cell, size: number): Point => ({ x: size * SQRT3 * (cell.q + cell.r / 2), z: size * 1.5 * cell.r });

// Axial cell containing a point, by rounding the fractional cube coordinates.
export const pointToCell = (point: Point, size: number): Cell => {
  const q = ((SQRT3 / 3) * point.x - point.z / 3) / size;
  const r = ((2 / 3) * point.z) / size;
  let rq = Math.round(q);
  let rr = Math.round(r);
  const rs = Math.round(-q - r);
  const dq = Math.abs(rq - q);
  const dr = Math.abs(rr - r);
  const ds = Math.abs(rs - (-q - r));
  if (dq > dr && dq > ds) rq = -rr - rs;
  else if (dr > ds) rr = -rq - rs;
  return { q: rq + 0, r: rr + 0 };
};

// The corner of a hexagon between two edges: the corner `index` sits 30° counter-clockwise of edge `index`, so edge `i` lies between corners `i - 1` and `i`.
export const cornerOf = (centre: Point, size: number, index: number): Point => {
  const angle = ((60 * index + 30) * Math.PI) / 180;
  return { x: centre.x + size * Math.cos(angle), z: centre.z - size * Math.sin(angle) };
};

// The corners that bound edge `edge`, in order.
export const edgeCorners = (centre: Point, size: number, edge: number): readonly [Point, Point] => [cornerOf(centre, size, (edge + HEX_EDGE_COUNT - 1) % HEX_EDGE_COUNT), cornerOf(centre, size, edge)];
