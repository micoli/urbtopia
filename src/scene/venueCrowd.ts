import { reachableCells, worldOf } from './venueAgents';
import { FIXTURES, fixtureTiles, type Coord, type FixtureId, type StaffRole, type VenueFixture } from '../core';

export type FigureKind = 'gamer' | 'queue' | 'employee' | 'diner';

export interface Figure extends Coord {
  kind: FigureKind;
  // The role of an employee, which sets its model and its post.
  role?: StaffRole;
  facing: number;
}

export interface CrowdInput {
  size: number;
  entrance: Coord;
  fixtures: readonly VenueFixture[];
  usageByFixture: ReadonlyMap<number, number>;
  saturation: number;
  demandRatio: number;
  employees: number;
  // The hired staff of a Venue that shows each role at its post; with it, `employees` is not used.
  staff?: readonly { role: StaffRole; count: number }[];
}

export const CROWD = { maxQueue: 6, maxFigures: 24, maxPerRole: 2 };

// The Fixtures an employee stands at, by role: a cook at the cooktop, a waiter among the tables, the maitre d' at the checkout.
const POSTS: Partial<Record<StaffRole, readonly FixtureId[]>> = {
  cook: ['cooktop'], kitchenAssistant: ['prepTable'], bartender: ['restaurantBar'], waiter: ['restaurantTable'], maitreD: ['restaurantCheckout'],
};

// Fixtures where Visitors queue: the counter of an Arcade, a checkout, the reception desk of a Hotel.
const COUNTERS: readonly FixtureId[] = ['counter', 'checkout', 'receptionDesk'];

const FRONT: readonly Coord[] = [{ x: 0, y: 1 }, { x: -1, y: 0 }, { x: 0, y: -1 }, { x: 1, y: 0 }];
const AROUND: readonly Coord[] = [{ x: 0, y: 1 }, { x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: -1 }];

const keyOf = (cell: Coord): string => `${cell.x}:${cell.y}`;
const gap = (a: Coord, b: Coord): number => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
const centerOf = (tiles: readonly Coord[]): Coord => ({ x: tiles.reduce((sum, tile) => sum + tile.x, 0) / tiles.length, y: tiles.reduce((sum, tile) => sum + tile.y, 0) / tiles.length });
const facingTo = (from: Coord, to: Coord): number => Math.atan2(to.x - from.x, to.y - from.y);

export function planCrowd(input: CrowdInput): Figure[] {
  const { size, entrance, fixtures } = input;
  const taken = new Set<string>([keyOf(entrance), ...fixtures.flatMap(fixtureTiles).map(keyOf)]);
  const reachable = reachableCells(worldOf(size, entrance, fixtures));
  const inside = (cell: Coord) => cell.x >= 0 && cell.y >= 0 && cell.x < size && cell.y < size;
  const vacant = (cell: Coord) => inside(cell) && !taken.has(keyOf(cell));
  const free = (cell: Coord) => vacant(cell) && reachable.has(keyOf(cell));
  const figures: Figure[] = [];
  // The employees have their place wherever it is, in a walled kitchen too; the customers only stand where they can walk to.
  const add = (kind: FigureKind, cell: Coord, target: Coord) => {
    if (figures.length >= CROWD.maxFigures || !(kind === 'employee' ? vacant(cell) : free(cell))) return false;
    taken.add(keyOf(cell));
    figures.push({ kind, x: cell.x, y: cell.y, facing: facingTo(cell, target) });
    return true;
  };
  const nearest = (origin: Coord, count: number, anywhere = false): Coord[] => {
    const cells: Coord[] = [];
    for (let x = 0; x < size; x++) for (let y = 0; y < size; y++) if (anywhere ? vacant({ x, y }) : free({ x, y })) cells.push({ x, y });
    return cells.sort((a, b) => gap(a, origin) - gap(b, origin) || a.y - b.y || a.x - b.x).slice(0, count);
  };

  const faces = (seat: VenueFixture, host: VenueFixture): boolean => {
    const front = FRONT[seat.rotation % 4]!;
    return fixtureTiles(host).some(tile => tile.x === seat.x + front.x && tile.y === seat.y + front.y);
  };
  const isSeat = (fixture: VenueFixture): boolean => FIXTURES[fixture.type].seat !== undefined;
  const hasSeat = (host: VenueFixture): boolean => fixtures.some(seat => isSeat(seat) && faces(seat, host));
  const inUse = (fixture: VenueFixture): boolean => (input.usageByFixture.get(fixture.id) ?? 0) > 0 && !COUNTERS.includes(fixture.type);
  const seats = fixtures.filter(fixture => inUse(fixture) && isSeat(fixture)).sort((a, b) => a.id - b.id);
  const games = fixtures.filter(fixture => inUse(fixture) && !isSeat(fixture) && !hasSeat(fixture)).sort((a, b) => a.id - b.id);
  const counter = fixtures.find(fixture => COUNTERS.includes(fixture.type));
  const hub = counter ? centerOf(fixtureTiles(counter)) : entrance;
  if (input.staff) {
    for (const { role, count } of input.staff) {
      const posts = fixtures.filter(fixture => POSTS[role]?.includes(fixture.type)).sort((a, b) => a.id - b.id);
      for (let k = 0; k < Math.min(count, CROWD.maxPerRole); k++) {
        const post = posts[k % Math.max(1, posts.length)];
        const around = post ? fixtureTiles(post).flatMap(tile => [FRONT[post.rotation % 4]!, ...AROUND].map(offset => ({ cell: { x: tile.x + offset.x, y: tile.y + offset.y }, tile }))) : [];
        const spot = around.find(candidate => vacant(candidate.cell));
        const cell = spot?.cell ?? nearest(hub, 1, true)[0];
        if (!cell || figures.length >= CROWD.maxFigures) continue;
        taken.add(keyOf(cell));
        figures.push({ kind: 'employee', role, x: cell.x, y: cell.y, facing: facingTo(cell, spot?.tile ?? hub) });
      }
    }
  } else for (const cell of nearest(hub, Math.min(input.employees, 3), true)) add('employee', cell, hub);

  for (const seat of seats) {
    if (figures.length >= CROWD.maxFigures || !AROUND.some(offset => reachable.has(keyOf({ x: seat.x + offset.x, y: seat.y + offset.y })))) continue;
    const front = FRONT[seat.rotation % 4]!;
    figures.push({ kind: 'diner', x: seat.x, y: seat.y, facing: facingTo(seat, { x: seat.x + front.x, y: seat.y + front.y }) });
  }
  const players = games.length === 0 ? 0 : Math.max(1, Math.min(games.length, Math.round(input.saturation * games.length)));
  for (const fixture of games.slice(0, players)) {
    const tiles = fixtureTiles(fixture);
    const front = FRONT[fixture.rotation % 4]!;
    const candidates = tiles.flatMap(tile => [front, ...AROUND].map(offset => ({ cell: { x: tile.x + offset.x, y: tile.y + offset.y }, tile })));
    const spot = candidates.find(candidate => free(candidate.cell));
    if (spot) add('gamer', spot.cell, spot.tile);
  }

  const waiting = input.demandRatio > 1 || games.length === 0 ? Math.ceil(Math.min(1, Math.max(0, input.demandRatio - 1)) * CROWD.maxQueue) : 0;
  for (const cell of nearest(hub, Math.min(CROWD.maxQueue, waiting))) add('queue', cell, hub);
  return figures;
}
