import floorBalance from '../../../assets/defs/balance/factoryFloor.json' with { type: 'json' };
import { FIXTURES } from '../venues/fixtures';
import type { FixtureSide } from '../venues/venueVocabulary';
import type { Building, VenueFixture } from '../engine/state';

export type Turn = 'cw' | 'ccw';

export interface FloorLinks {
  // The Machines that receive every Drive and every Flow they need.
  linked: ReadonlySet<number>;
  // A group of Gears fed in two opposite directions: nothing in it turns.
  jammed: boolean;
}

export interface FloorBonus {
  speed: number;
  yield: number;
}

type Cell = { x: number; y: number };
type Kind = 'drive' | 'flow';

// Where each side of a Fixture drawn with rotation 0 faces; each quarter turn takes (x, y) to (-y, x).
const SIDE_OFFSETS: Record<FixtureSide, Cell> = { front: { x: 0, y: 1 }, right: { x: 1, y: 0 }, back: { x: 0, y: -1 }, left: { x: -1, y: 0 } };

const turned = ({ x, y }: Cell, quarterTurns: number): Cell => (quarterTurns % 4 === 0 ? { x, y } : turned({ x: -y, y: x }, quarterTurns - 1));

const keyOf = (x: number, y: number): string => `${x},${y}`;

const flip = (turn: Turn): Turn => (turn === 'cw' ? 'ccw' : 'cw');

const isFactoryFixture = (fixture: VenueFixture): boolean => FIXTURES[fixture.type].venue === 'factory' && FIXTURES[fixture.type].role !== undefined;

const roleOf = (fixture: VenueFixture) => FIXTURES[fixture.type].role;

const sidesOf = (fixture: VenueFixture, kind: Kind): readonly FixtureSide[] => FIXTURES[fixture.type][kind] ?? [];

const opensToward = (fixture: VenueFixture, kind: Kind, target: Cell): boolean =>
  sidesOf(fixture, kind).some(side => {
    const offset = turned(SIDE_OFFSETS[side], fixture.rotation);
    return fixture.x + offset.x === target.x && fixture.y + offset.y === target.y;
  });

// The Fixtures that a Fixture hands Drive or Flow to, and takes it from: both sides of the edge must be open.
function connectionsOf(fixture: VenueFixture, kind: Kind, at: ReadonlyMap<string, VenueFixture>): VenueFixture[] {
  return sidesOf(fixture, kind).flatMap(side => {
    const offset = turned(SIDE_OFFSETS[side], fixture.rotation);
    const neighbour = at.get(keyOf(fixture.x + offset.x, fixture.y + offset.y));
    return neighbour && opensToward(neighbour, kind, fixture) ? [neighbour] : [];
  });
}

const placedOn = (fixtures: readonly VenueFixture[]): Map<string, VenueFixture> => new Map(fixtures.map(fixture => [keyOf(fixture.x, fixture.y), fixture]));

// A Machine takes the Drive it is handed and passes none on.
const isMachine = (fixture: VenueFixture): boolean => roleOf(fixture) === 'machine';

// The groups of Fixtures that can pass Drive to one another, without crossing a Machine.
function driveGroups(fixtures: readonly VenueFixture[], at: ReadonlyMap<string, VenueFixture>): VenueFixture[][] {
  const seen = new Set<number>();
  const groups: VenueFixture[][] = [];
  for (const start of fixtures.filter(fixture => sidesOf(fixture, 'drive').length > 0 && !isMachine(fixture))) {
    if (seen.has(start.id)) continue;
    const group: VenueFixture[] = [];
    const queue = [start];
    seen.add(start.id);
    while (queue.length > 0) {
      const current = queue.pop()!;
      group.push(current);
      for (const next of connectionsOf(current, 'drive', at)) {
        if (isMachine(next) || seen.has(next.id)) continue;
        seen.add(next.id);
        queue.push(next);
      }
    }
    groups.push(group);
  }
  return groups;
}

interface DriveReceipts {
  // The directions each Machine is handed, by id.
  received: Map<number, Set<Turn>>;
  jammed: boolean;
}

function driveReceipts(fixtures: readonly VenueFixture[], at: ReadonlyMap<string, VenueFixture>): DriveReceipts {
  const received = new Map<number, Set<Turn>>();
  let jammed = false;
  for (const group of driveGroups(fixtures, at)) {
    const turns = new Map<number, Turn>();
    const queue = group.filter(fixture => roleOf(fixture) === 'motor');
    queue.forEach(motor => turns.set(motor.id, 'cw'));
    const handed: [number, Turn][] = [];
    let conflict = false;
    while (queue.length > 0 && !conflict) {
      const current = queue.shift()!;
      const turn = turns.get(current.id)!;
      for (const next of connectionsOf(current, 'drive', at)) {
        if (isMachine(next)) {
          handed.push([next.id, turn]);
          continue;
        }
        const nextTurn = roleOf(current) === 'gear' && roleOf(next) === 'gear' ? flip(turn) : turn;
        const known = turns.get(next.id);
        if (known === undefined) {
          turns.set(next.id, nextTurn);
          queue.push(next);
        } else if (known !== nextTurn) conflict = true;
      }
    }
    if (conflict) {
      jammed = true;
      continue;
    }
    for (const [id, turn] of handed) received.set(id, (received.get(id) ?? new Set<Turn>()).add(turn));
  }
  return { received, jammed };
}

// The Fixtures that Flow reaches from the Pumps, through open Pipes, and the Machines at their ends.
function flowReach(fixtures: readonly VenueFixture[], at: ReadonlyMap<string, VenueFixture>): Set<number> {
  const reached = new Set<number>();
  const queue = fixtures.filter(fixture => roleOf(fixture) === 'pump');
  queue.forEach(pump => reached.add(pump.id));
  while (queue.length > 0) {
    const current = queue.shift()!;
    for (const next of connectionsOf(current, 'flow', at)) {
      if (reached.has(next.id)) continue;
      reached.add(next.id);
      if (!isMachine(next)) queue.push(next);
    }
  }
  return reached;
}

export function floorLinksOf(allFixtures: readonly VenueFixture[]): FloorLinks {
  const fixtures = allFixtures.filter(fixture => isFactoryFixture(fixture) && fixture.broken !== true);
  const at = placedOn(fixtures);
  const { received, jammed } = driveReceipts(fixtures, at);
  const flowing = flowReach(fixtures, at);
  const linked = new Set<number>();
  for (const machine of fixtures.filter(isMachine)) {
    const spec = FIXTURES[machine.type];
    const turns = received.get(machine.id);
    if (spec.drive && (turns?.size !== 1 || (spec.turns !== undefined && !turns.has(spec.turns)))) continue;
    if (spec.flow && !flowing.has(machine.id)) continue;
    linked.add(machine.id);
  }
  return { linked, jammed };
}

const capOf = (caps: readonly number[], tier: number): number => caps[Math.min(tier, caps.length) - 1]!;

export const floorGridSizeOf = (tier: number): number => capOf(floorBalance.gridSizes, tier);

// What the linked Machines add to the speed and to the yield of the Factory's Slots, each up to the cap of the Factory's Tier.
export function floorBonusOf(fixtures: readonly VenueFixture[], tier: number): FloorBonus {
  const { linked } = floorLinksOf(fixtures);
  const machines = fixtures.filter(fixture => linked.has(fixture.id));
  const sum = (key: 'speed' | 'yield') => machines.reduce((total, fixture) => total + (FIXTURES[fixture.type][key] ?? 0), 0);
  return { speed: Math.min(sum('speed'), capOf(floorBalance.speedCaps, tier)), yield: Math.min(sum('yield'), capOf(floorBalance.yieldCaps, tier)) };
}

const NO_BONUS: FloorBonus = { speed: 0, yield: 0 };

export const floorBonusOfBuilding = (building: Pick<Building, 'tier' | 'floor'>): FloorBonus => (building.floor ? floorBonusOf(building.floor.fixtures, building.tier) : NO_BONUS);
