import { DIR_DELTA, isOccupied, type Edge, type Plan } from '../core/architect/housePlan.ts';

// Proportions of the game's house models (Blender style "urbtopia"), at the scale of the studio where a floor is 1 high.
// The walls stand back from the cell border: the roof overhangs them by this much more. A window brick is 0.7 wide:
// at a convex corner the flat part of the wall (up to 0.5 - inset - corner radius) has to cover it.
export const WALL_INSET = 0.06;
export const PLINTH_HEIGHT = 0.17;
export const PLINTH_PUSH = 0.04; // how far the plinth stands out of the wall
export const WALL_CORNER_RADIUS = 0.08;
export const TRIM_COLOR = '#9ea2b4'; // the trim of the game's building palette: plinth, slabs, frames
export const DARK_COLOR = '#7a7d8c'; // the dark of the game's building palette: rails, doors

export type EndKind = 'convex' | 'concave' | 'straight';

export interface WallEnds {
  left: EndKind;
  right: EndKind;
}

// Seen from outside, the right-hand neighbour of an edge is (dir + 3) % 4 and the left-hand one (dir + 1) % 4.
// Without a neighbour the wall turns a convex corner; with a neighbour whose front is built too, a concave one.
export function wallEnds(plan: Plan, edge: Edge): WallEnds {
  const kind = (side: number): EndKind => {
    const [sc, sr] = [edge.c + DIR_DELTA[side]![0]!, edge.r + DIR_DELTA[side]![1]!];
    if (!isOccupied(plan, edge.floor, sc, sr)) return 'convex';
    return isOccupied(plan, edge.floor, sc + DIR_DELTA[edge.dir]![0]!, sr + DIR_DELTA[edge.dir]![1]!) ? 'concave' : 'straight';
  };
  return { left: kind((edge.dir + 1) % 4), right: kind((edge.dir + 3) % 4) };
}

// Where the end of a wall stands once the walls are inset: a convex corner is reached sooner, a concave one later.
export function endShift(kind: EndKind): number {
  if (kind === 'convex') return WALL_INSET;
  return kind === 'concave' ? -WALL_INSET : 0;
}

// How far each side of a cell reaches from its centre: the whole cell against a neighbour, the wall (plus `push`) on a free side.
export function cellReach(plan: Plan, floor: number, c: number, r: number, push = 0): { west: number; east: number; north: number; south: number } {
  const reach = (side: number) => (isOccupied(plan, floor, c + DIR_DELTA[side]![0]!, r + DIR_DELTA[side]![1]!) ? 0.5 : 0.5 - WALL_INSET + push);
  return { north: reach(0), east: reach(1), south: reach(2), west: reach(3) };
}
