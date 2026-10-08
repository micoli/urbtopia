import { ARCADE_FIXTURES, fixtureTiles, type Coord, type VenueFixture } from '../core';

export type FigureKind = 'gamer' | 'queue' | 'employee';

export interface Figure extends Coord {
  kind: FigureKind;
  facing: number;
}

export interface CrowdInput {
  size: number;
  entrance: Coord;
  fixtures: readonly VenueFixture[];
  playsByFixture: ReadonlyMap<number, number>;
  saturation: number;
  demandRatio: number;
  employees: number;
}

export const CROWD = { maxQueue: 6, maxFigures: 24 };

const FRONT: readonly Coord[] = [{ x: 0, y: 1 }, { x: -1, y: 0 }, { x: 0, y: -1 }, { x: 1, y: 0 }];
const AROUND: readonly Coord[] = [{ x: 0, y: 1 }, { x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: -1 }];

const keyOf = (cell: Coord): string => `${cell.x}:${cell.y}`;
const gap = (a: Coord, b: Coord): number => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
const centerOf = (tiles: readonly Coord[]): Coord => ({ x: tiles.reduce((sum, tile) => sum + tile.x, 0) / tiles.length, y: tiles.reduce((sum, tile) => sum + tile.y, 0) / tiles.length });
const facingTo = (from: Coord, to: Coord): number => Math.atan2(to.x - from.x, to.y - from.y);

export function planCrowd(input: CrowdInput): Figure[] {
  const { size, entrance, fixtures } = input;
  const taken = new Set<string>([keyOf(entrance), ...fixtures.flatMap(fixtureTiles).map(keyOf)]);
  const inside = (cell: Coord) => cell.x >= 0 && cell.y >= 0 && cell.x < size && cell.y < size;
  const free = (cell: Coord) => inside(cell) && !taken.has(keyOf(cell));
  const figures: Figure[] = [];
  const add = (kind: FigureKind, cell: Coord, target: Coord) => {
    if (figures.length >= CROWD.maxFigures || !free(cell)) return false;
    taken.add(keyOf(cell));
    figures.push({ kind, x: cell.x, y: cell.y, facing: facingTo(cell, target) });
    return true;
  };
  const nearest = (origin: Coord, count: number): Coord[] => {
    const cells: Coord[] = [];
    for (let x = 0; x < size; x++) for (let y = 0; y < size; y++) if (free({ x, y })) cells.push({ x, y });
    return cells.sort((a, b) => gap(a, origin) - gap(b, origin) || a.y - b.y || a.x - b.x).slice(0, count);
  };

  const games = fixtures.filter(fixture => (input.playsByFixture.get(fixture.id) ?? 0) > 0 && ARCADE_FIXTURES[fixture.type].playsPerHour > 0).sort((a, b) => a.id - b.id);
  const players = games.length === 0 ? 0 : Math.max(1, Math.min(games.length, Math.round(input.saturation * games.length)));
  for (const fixture of games.slice(0, players)) {
    const tiles = fixtureTiles(fixture);
    const center = centerOf(tiles);
    const front = FRONT[fixture.rotation % 4]!;
    const candidates = tiles.flatMap(tile => [front, ...AROUND].map(offset => ({ x: tile.x + offset.x, y: tile.y + offset.y })));
    const spot = candidates.find(free);
    if (spot) add('gamer', spot, center);
  }

  const counter = fixtures.find(fixture => fixture.type === 'counter');
  const hub = counter ? centerOf(fixtureTiles(counter)) : entrance;
  for (const cell of nearest(hub, Math.min(input.employees, 3))) add('employee', cell, hub);

  const waiting = input.demandRatio > 1 || games.length === 0 ? Math.ceil(Math.min(1, Math.max(0, input.demandRatio - 1)) * CROWD.maxQueue) : 0;
  for (const cell of nearest(hub, Math.min(CROWD.maxQueue, waiting))) add('queue', cell, hub);
  return figures;
}
