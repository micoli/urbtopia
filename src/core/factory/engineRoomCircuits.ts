import interiorBalance from '../../../assets/defs/balance/factoryInterior.json' with { type: 'json' };
import { FIXTURES } from '../venues/fixtures';
import { tilesOf } from '../venues/layout';
import type { FixtureMedium, FixturePort } from '../venues/venueVocabulary';
import type { Building, BuildingType, VenueFixture } from '../engine/state';
import { engineRoomBalanceOf, type EngineRoomCircuit, type EngineRoomLink } from '../interiors/interiorStaff';
import { valueByTier } from '../interiors/valueByTier';
import { SIDE_OFFSETS, cellBeyond, keyOf, placedOn, turned } from './interiorLinks';
import type { LinePath } from './interiorLine';
import { memoizedByLayout } from './memoizedByLayout';

// A Circuit of an Engine room that is complete: the Fixtures it uses, by the family of each (the anchor, the wall ports, the Machines), and the links that join them.
export interface CompleteCircuit {
  anchor: number;
  members: ReadonlyMap<string, number>;
  linking: ReadonlySet<number>;
  // The way each Medium takes from one Fixture to the next of its link: the source, the links crossed in order, and the target.
  routes: readonly { medium: FixtureMedium; ids: readonly number[] }[];
}

export interface EngineRoomReport {
  circuits: readonly CompleteCircuit[];
  // Every Fixture that a complete Circuit uses, its links included.
  used: ReadonlySet<number>;
}

const NO_REPORT: EngineRoomReport = { circuits: [], used: new Set() };

const familyOf = (fixture: VenueFixture): string | undefined => FIXTURES[fixture.type].family;

const portsOf = (fixture: VenueFixture): readonly FixturePort[] => FIXTURES[fixture.type].ports ?? [];

const covers = (fixture: VenueFixture, cell: { x: number; y: number }): boolean => tilesOf(fixture).some(tile => tile.x === cell.x && tile.y === cell.y);

const gives = (port: FixturePort): boolean => port.direction !== 'in';

const takes = (port: FixturePort): boolean => port.direction !== 'out';

// The Fixtures that a Fixture hands a Medium to: through a port that gives it, onto a port of the same Medium that takes it, on the side of the neighbour that faces back.
function handedTo(fixture: VenueFixture, medium: FixtureMedium, at: ReadonlyMap<string, VenueFixture>): VenueFixture[] {
  return portsOf(fixture).filter(port => port.medium === medium && gives(port)).flatMap(port => {
    const cell = cellBeyond(fixture, port.side);
    const neighbour = at.get(keyOf(cell.x, cell.y));
    if (!neighbour || neighbour === fixture) return [];
    const meets = portsOf(neighbour).some(other => other.medium === medium && takes(other) && covers(fixture, cellBeyond(neighbour, other.side)));
    return meets ? [neighbour] : [];
  });
}

const isLink = (fixture: VenueFixture): boolean => familyOf(fixture) === 'link';

const isSound = (fixture: VenueFixture): boolean => fixture.broken !== true;

// The Fixtures a Medium can go to from a Fixture, through links that are unbroken: the ones that end the way (anything that is not a link), and the links crossed to reach them.
interface Reach {
  ends: VenueFixture[];
  crossed: Map<number, VenueFixture[]>;
}

function reachFrom(source: VenueFixture, medium: FixtureMedium, at: ReadonlyMap<string, VenueFixture>): Reach {
  const ends: VenueFixture[] = [];
  const crossed = new Map<number, VenueFixture[]>();
  const seen = new Set<number>([source.id]);
  const queue: { fixture: VenueFixture; way: VenueFixture[] }[] = [{ fixture: source, way: [] }];
  while (queue.length > 0) {
    const { fixture, way } = queue.shift()!;
    for (const next of handedTo(fixture, medium, at)) {
      if (seen.has(next.id) || !isSound(next)) continue;
      seen.add(next.id);
      if (isLink(next)) {
        queue.push({ fixture: next, way: [...way, next] });
        continue;
      }
      ends.push(next);
      crossed.set(next.id, way);
    }
  }
  return { ends, crossed };
}

const reachOf = (reaches: Map<string, Reach>, source: VenueFixture, medium: FixtureMedium, at: ReadonlyMap<string, VenueFixture>): Reach => {
  const key = `${source.id}:${medium}`;
  const known = reaches.get(key);
  if (known) return known;
  const reach = reachFrom(source, medium, at);
  reaches.set(key, reach);
  return reach;
};

// One Circuit around an anchor: every family of the Circuit takes one Fixture that no other Circuit uses, reached from the ones already taken through the links of the flowchart.
function circuitAround(anchor: VenueFixture, circuit: EngineRoomCircuit, fixtures: readonly VenueFixture[], at: ReadonlyMap<string, VenueFixture>, used: ReadonlySet<number>, reaches: Map<string, Reach>): CompleteCircuit | undefined {
  const members = new Map<string, VenueFixture>([[circuit.anchor, anchor]]);
  const linking = new Set<number>();
  const routes: { medium: FixtureMedium; ids: number[] }[] = [];
  const free = (fixture: VenueFixture): boolean => isSound(fixture) && !used.has(fixture.id) && ![...members.values()].includes(fixture);
  const pending = [...circuit.links];
  while (pending.length > 0) {
    const closing = pending.findIndex((link: EngineRoomLink) => members.has(link.from) && members.has(link.to));
    if (closing >= 0) {
      const [link] = pending.splice(closing, 1) as [EngineRoomLink];
      if (!reachOf(reaches, members.get(link.from)!, link.medium, at).ends.includes(members.get(link.to)!)) return undefined;
      continue;
    }
    const index = pending.findIndex((link: EngineRoomLink) => members.has(link.from) !== members.has(link.to));
    if (index < 0) return undefined;
    const [link] = pending.splice(index, 1) as [EngineRoomLink];
    if (members.has(link.from)) {
      const reach = reachOf(reaches, members.get(link.from)!, link.medium, at);
      const target = reach.ends.find(end => familyOf(end) === link.to && free(end));
      if (!target) return undefined;
      members.set(link.to, target);
      const way = reach.crossed.get(target.id) ?? [];
      for (const crossed of way) linking.add(crossed.id);
      routes.push({ medium: link.medium, ids: [members.get(link.from)!.id, ...way.map(crossed => crossed.id), target.id] });
      continue;
    }
    const target = members.get(link.to)!;
    const source = fixtures.find(candidate => familyOf(candidate) === link.from && free(candidate) && reachOf(reaches, candidate, link.medium, at).ends.includes(target));
    if (!source) return undefined;
    members.set(link.from, source);
    const way = reachOf(reaches, source, link.medium, at).crossed.get(target.id) ?? [];
    for (const crossed of way) linking.add(crossed.id);
    routes.push({ medium: link.medium, ids: [source.id, ...way.map(crossed => crossed.id), target.id] });
  }
  return { anchor: anchor.id, members: new Map([...members].map(([family, fixture]) => [family, fixture.id])), linking, routes };
}

const circuitsOf = (fixtures: readonly VenueFixture[], type: BuildingType): EngineRoomReport => {
  const balance = engineRoomBalanceOf(type);
  if (!balance) return NO_REPORT;
  const at = placedOn(fixtures);
  const reaches = new Map<string, Reach>();
  const used = new Set<number>();
  const complete: CompleteCircuit[] = [];
  for (const circuit of balance.circuits) {
    for (const anchor of fixtures.filter(fixture => familyOf(fixture) === circuit.anchor && isSound(fixture) && !used.has(fixture.id))) {
      const found = circuitAround(anchor, circuit, fixtures, at, used, reaches);
      if (!found) continue;
      complete.push(found);
      for (const id of [...found.members.values(), ...found.linking]) used.add(id);
    }
  }
  return { circuits: complete, used };
};

// The type of the building is part of what a report depends on, so each type has its own cache.
const reportersByType = new Map<BuildingType, (fixtures: readonly VenueFixture[]) => EngineRoomReport>();

const reporterOf = (type: BuildingType) => {
  const known = reportersByType.get(type);
  if (known) return known;
  const created = memoizedByLayout(fixtures => circuitsOf(fixtures, type));
  reportersByType.set(type, created);
  return created;
};

// The complete Circuits of an Engine room: only those count for its bonus.
export const engineRoomReportOf = (building: Pick<Building, 'type' | 'interior'>): EngineRoomReport => (building.interior ? reporterOf(building.type)(building.interior.fixtures) : NO_REPORT);

export interface EngineRoomGains {
  circuits: number;
  // The share of the plant's Capacity that its complete Circuits add.
  generation: number;
  // The share of the plant's pollution that its complete Circuits take away (a Coal Power plant).
  cleaner: number;
}

export const NO_ENGINE_ROOM_GAINS: EngineRoomGains = { circuits: 0, generation: 0, cleaner: 0 };

// A gain counts in full up to a share of the cap of the Tier, then grows with every Circuit but less and less, and never reaches the cap.
const saturated = (total: number, cap: number, kneeShare: number): number => {
  const knee = cap * kneeShare;
  return total <= knee ? total : cap - (cap - knee) * Math.exp(-(total - knee) / (cap - knee));
};

export function engineRoomGainsOf(building: Pick<Building, 'type' | 'tier' | 'interior'>): EngineRoomGains {
  const balance = engineRoomBalanceOf(building.type);
  if (!balance) return NO_ENGINE_ROOM_GAINS;
  const circuits = engineRoomReportOf(building).circuits.length;
  if (circuits === 0) return NO_ENGINE_ROOM_GAINS;
  const gainOf = (caps: readonly number[]): number => {
    const cap = valueByTier(caps, building.tier);
    return saturated(circuits * cap * balance.circuitShare, cap, interiorBalance.bonusKnee);
  };
  return { circuits, generation: gainOf(balance.generationCaps), cleaner: balance.pollutionCaps ? gainOf(balance.pollutionCaps) : 0 };
}

const motions = new WeakMap<ReadonlySet<number>, ReadonlyMap<number, 'cw'>>();

// The Fixtures of an Engine room that run, which turn their parts and smoke, and that wear: those of its complete Circuits. The same map comes back for the same state of the floor.
export function engineRoomMotionOf(building: Pick<Building, 'type' | 'interior'>): ReadonlyMap<number, 'cw'> {
  const { used } = engineRoomReportOf(building);
  const known = motions.get(used);
  if (known) return known;
  const motion = new Map([...used].map((id): [number, 'cw'] => [id, 'cw']));
  motions.set(used, motion);
  return motion;
}

const COAL_MOUTH = 0.15;
const HOPPER = 0.45;

const centreOf = (fixture: VenueFixture) => ({ x: fixture.x + 0.5, y: fixture.y + 0.5 });

const towardSide = (fixture: VenueFixture, side: 'front' | 'back', distance: number) => {
  const offset = turned(SIDE_OFFSETS[side], fixture.rotation);
  return { x: fixture.x + 0.5 + offset.x * distance, y: fixture.y + 0.5 + offset.y * distance };
};

const coalPaths = new WeakMap<ReadonlySet<number>, readonly LinePath[]>();

// The ways the coal takes on the floor of an Engine room, one for each complete Circuit that carries some: from the mouth of the Coal quay, along the Conveyors, to the hopper of the Steam boiler. A picture, never counted.
export function engineRoomCoalPathsOf(building: Pick<Building, 'type' | 'interior'>): readonly LinePath[] {
  const report = engineRoomReportOf(building);
  const known = coalPaths.get(report.used);
  if (known) return known;
  const byId = new Map((building.interior?.fixtures ?? []).map(fixture => [fixture.id, fixture]));
  const paths = report.circuits.flatMap(circuit => circuit.routes.filter(route => route.medium === 'coal').flatMap((route): LinePath[] => {
    const fixtures = route.ids.map(id => byId.get(id)).filter((fixture): fixture is VenueFixture => fixture !== undefined);
    if (fixtures.length < 2) return [];
    const first = fixtures[0]!;
    const last = fixtures[fixtures.length - 1]!;
    return [{ source: first.id, coal: true, points: [towardSide(first, 'front', COAL_MOUTH), ...fixtures.slice(1, -1).map(centreOf), towardSide(last, 'back', HOPPER)] }];
  }));
  coalPaths.set(report.used, paths);
  return paths;
}
