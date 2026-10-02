import type { Coord } from './coord';
import { DIRECTIONS, type Direction } from './geometry';

export type RoadKind = 'road' | 'crossing';
export type RoadPieceName = 'square' | 'end' | 'straight' | 'bend' | 'intersection' | 'crossroad' | 'crossing';

export interface RoadPiece {
  piece: RoadPieceName;
  rotation: number;
}

const COUNTER_CLOCKWISE: readonly Direction[] = ['E', 'N', 'W', 'S'];

const BASE_PIECES: readonly { piece: Exclude<RoadPieceName, 'crossing'>; exits: Direction[] }[] = [
  { piece: 'square', exits: [] },
  { piece: 'end', exits: ['E'] },
  { piece: 'straight', exits: ['W', 'E'] },
  { piece: 'bend', exits: ['W', 'S'] },
  { piece: 'intersection', exits: ['W', 'E', 'S'] },
  { piece: 'crossroad', exits: ['N', 'E', 'S', 'W'] },
];

function rotateDirection(direction: Direction, quarterTurns: number): Direction {
  const index = COUNTER_CLOCKWISE.indexOf(direction);
  return COUNTER_CLOCKWISE[(index + quarterTurns) % 4] ?? direction;
}

function sameExits(a: readonly Direction[], b: readonly Direction[]): boolean {
  return a.length === b.length && DIRECTIONS.every((direction) => a.includes(direction) === b.includes(direction));
}

export function roadPiece(exits: readonly Direction[], kind: RoadKind = 'road'): RoadPiece {
  for (const base of BASE_PIECES) {
    for (let rotation = 0; rotation < 4; rotation++) {
      const rotated = base.exits.map((direction) => rotateDirection(direction, rotation));
      if (!sameExits(rotated, exits)) continue;
      if (kind === 'crossing' && base.piece === 'straight') return { piece: 'crossing', rotation };
      return { piece: base.piece, rotation };
    }
  }
  return { piece: 'square', rotation: 0 };
}

export function roadPath(from: Coord, to: Coord, horizontalFirst: boolean): Coord[] {
  const corner: Coord = horizontalFirst ? { x: to.x, y: from.y } : { x: from.x, y: to.y };
  return dedupe([...line(from, corner), ...line(corner, to)]);
}

function line(from: Coord, to: Coord): Coord[] {
  const tiles: Coord[] = [];
  const stepX = Math.sign(to.x - from.x);
  const stepY = Math.sign(to.y - from.y);
  let current = { ...from };
  tiles.push(current);
  while (current.x !== to.x || current.y !== to.y) {
    current = { x: current.x + stepX, y: current.y + stepY };
    tiles.push(current);
  }
  return tiles;
}

function dedupe(tiles: Coord[]): Coord[] {
  return tiles.filter((tile, index) => index === 0 || tile.x !== tiles[index - 1]?.x || tile.y !== tiles[index - 1]?.y);
}
