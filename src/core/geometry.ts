import type { Coord } from './coord';

export type Direction = 'N' | 'E' | 'S' | 'W';

export const DIRECTIONS: readonly Direction[] = ['N', 'E', 'S', 'W'];

export const DIRECTION_VECTORS: Record<Direction, Coord> = {
  N: { x: 0, y: -1 },
  E: { x: 1, y: 0 },
  S: { x: 0, y: 1 },
  W: { x: -1, y: 0 },
};

const FRONT_BY_ROTATION: readonly Direction[] = ['N', 'W', 'S', 'E'];

export function frontDirection(rotation: number): Direction {
  return FRONT_BY_ROTATION[((rotation % 4) + 4) % 4] ?? 'N';
}

export function neighbour(tile: Coord, direction: Direction): Coord {
  const vector = DIRECTION_VECTORS[direction];
  return { x: tile.x + vector.x, y: tile.y + vector.y };
}

export function tileKey(tile: Coord): string {
  return `${tile.x},${tile.y}`;
}
