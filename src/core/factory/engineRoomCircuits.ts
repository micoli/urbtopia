import interiorBalance from '../../../assets/defs/balance/factoryInterior.json' with { type: 'json' };
import { FIXTURES } from '../venues/fixtures';
import { tilesOf } from '../venues/layout';
import type { FixtureMedium, FixturePort } from '../venues/venueVocabulary';
import type { Building, BuildingType, VenueFixture } from '../engine/state';
import { engineRoomBalanceOf } from '../interiors/interiorStaff';
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
  // The links that clean the smoke are laid too.
  cleaned: boolean;
  // The Fixtures whose smoke goes to the Filter instead of their own chimney.
  diverted: readonly number[];
  // The weights of its anchor: what it adds to the generation of the plant, and, once cleaned, to the pollution it takes away.
  generation: number;
  cleaner: number;
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

// A port of a Fixture of the Circuit that no Fixture has met yet.
interface Unmet {
  fixture: VenueFixture;
  port: FixturePort;
}

interface Solving {
  members: Map<string, VenueFixture>;
  linking: Set<number>;
  routes: { medium: FixtureMedium; ids: number[] }[];
  unmet: Unmet[];
  diverted: number[];
}

const copyOf = (solving: Solving): Solving => ({ members: new Map(solving.members), linking: new Set(solving.linking), routes: [...solving.routes], unmet: [...solving.unmet], diverted: [...solving.diverted] });

const requiredPortsOf = (fixture: VenueFixture): Unmet[] => portsOf(fixture).filter(port => port.optional !== true).map(port => ({ fixture, port }));

const optionalPortsOf = (fixture: VenueFixture): Unmet[] => portsOf(fixture).filter(port => port.optional === true).map(port => ({ fixture, port }));

interface Context {
  fixtures: readonly VenueFixture[];
  at: ReadonlyMap<string, VenueFixture>;
  used: Set<number>;
  reaches: Map<string, Reach>;
}

// A Fixture that a Circuit can still take: sound, used by no other Circuit, and the only one of its family in this Circuit. A link is never a member.
const isFree = (fixture: VenueFixture, solving: Solving, { used }: Context): boolean => {
  const family = familyOf(fixture);
  return family !== undefined && family !== 'link' && isSound(fixture) && !used.has(fixture.id) && !solving.members.has(family);
};

interface Meeting {
  fixture: VenueFixture;
  // The Fixtures between the two, from the one that gives the Medium to the one that takes it.
  way: VenueFixture[];
  // The port of the new Fixture that the meeting uses up.
  met: FixturePort | undefined;
}

// The Fixtures that can meet a port: those that a port that gives a Medium reaches through unbroken links, or those that reach a port that takes it.
function meetingsOf({ fixture, port }: Unmet, solving: Solving, context: Context): Meeting[] {
  const { fixtures, at, reaches } = context;
  if (gives(port)) {
    const reach = reachOf(reaches, fixture, port.medium, at);
    return reach.ends
      .filter(end => isFree(end, solving, context))
      .map(end => ({ fixture: end, way: reach.crossed.get(end.id) ?? [], met: portsOf(end).find(other => other.medium === port.medium && takes(other)) }));
  }
  return fixtures
    .filter(candidate => isFree(candidate, solving, context) && reachOf(reaches, candidate, port.medium, at).ends.includes(fixture))
    .map(candidate => ({ fixture: candidate, way: reachOf(reaches, candidate, port.medium, at).crossed.get(fixture.id) ?? [], met: portsOf(candidate).find(other => other.medium === port.medium && gives(other)) }));
}

// Meets the ports one after the other: each takes a Fixture that nothing else uses, reached through the links, and the ports of that Fixture are met in turn. A port that has several candidates tries them in turn.
function meetAll(solving: Solving, context: Context, optional: boolean): Solving | undefined {
  const [unmet, ...rest] = solving.unmet;
  if (!unmet) return solving;
  for (const meeting of meetingsOf(unmet, solving, context)) {
    const next = copyOf(solving);
    const family = familyOf(meeting.fixture)!;
    next.members.set(family, meeting.fixture);
    for (const crossed of meeting.way) next.linking.add(crossed.id);
    const between = meeting.way.map(crossed => crossed.id);
    next.routes.push({ medium: unmet.port.medium, ids: gives(unmet.port) ? [unmet.fixture.id, ...between, meeting.fixture.id] : [meeting.fixture.id, ...between, unmet.fixture.id] });
    if (optional) next.diverted.push(unmet.fixture.id);
    const others = requiredPortsOf(meeting.fixture).filter(other => other.port !== meeting.met);
    next.unmet = [...rest, ...others];
    const solved = meetAll(next, context, optional);
    if (solved) return solved;
  }
  return undefined;
}

// One Circuit around an anchor: every port of its Fixtures is met, then, for the ports that are only optional, as many as can be: the Circuit counts without them, and is cleaned only with them all.
function circuitAround(anchor: VenueFixture, context: Context): CompleteCircuit | undefined {
  const start: Solving = { members: new Map([[familyOf(anchor)!, anchor]]), linking: new Set(), routes: [], unmet: requiredPortsOf(anchor), diverted: [] };
  const required = meetAll(start, context, false);
  if (!required) return undefined;
  const optional = [...required.members.values()].flatMap(optionalPortsOf);
  const cleaning = optional.length > 0 ? meetAll({ ...copyOf(required), unmet: optional }, context, true) : undefined;
  const kept = cleaning ?? required;
  const spec = FIXTURES[anchor.type];
  return {
    anchor: anchor.id,
    members: new Map([...kept.members].map(([family, fixture]) => [family, fixture.id])),
    linking: kept.linking,
    routes: kept.routes,
    cleaned: cleaning !== undefined,
    diverted: cleaning ? cleaning.diverted : [],
    generation: spec.generation ?? 0,
    cleaner: cleaning ? (spec.cleaner ?? 0) : 0,
  };
}

const circuitsOf = (fixtures: readonly VenueFixture[], type: BuildingType): EngineRoomReport => {
  if (!engineRoomBalanceOf(type)) return NO_REPORT;
  const context: Context = { fixtures, at: placedOn(fixtures), used: new Set<number>(), reaches: new Map<string, Reach>() };
  const { used } = context;
  const complete: CompleteCircuit[] = [];
  for (const anchor of fixtures.filter(fixture => (FIXTURES[fixture.type].generation ?? 0) > 0 && isSound(fixture))) {
    if (used.has(anchor.id)) continue;
    const found = circuitAround(anchor, context);
    if (!found) continue;
    complete.push(found);
    for (const id of [...found.members.values(), ...found.linking]) used.add(id);
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
  // The share of the plant's pollution that its cleaned Circuits take away (a Coal Power plant with a Filter on its boiler).
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
  const complete = engineRoomReportOf(building).circuits;
  if (complete.length === 0) return NO_ENGINE_ROOM_GAINS;
  const generating = complete.reduce((sum, circuit) => sum + circuit.generation, 0);
  const cleaning = complete.reduce((sum, circuit) => sum + circuit.cleaner, 0);
  const gainOf = (caps: readonly number[], count: number): number => {
    const cap = valueByTier(caps, building.tier);
    return count === 0 ? 0 : saturated(count * cap * balance.circuitShare, cap, interiorBalance.bonusKnee);
  };
  return { circuits: complete.length, generation: gainOf(balance.generationCaps, generating), cleaner: balance.pollutionCaps ? gainOf(balance.pollutionCaps, cleaning) : 0 };
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

const pictures = new WeakMap<ReadonlySet<number>, ReadonlyMap<number, 'cw'>>();

// What the scene moves: the Fixtures that run, but a boiler whose smoke goes to a Filter no longer smokes by its own chimney.
export function engineRoomPictureMotionOf(building: Pick<Building, 'type' | 'interior'>): ReadonlyMap<number, 'cw'> {
  const report = engineRoomReportOf(building);
  const known = pictures.get(report.used);
  if (known) return known;
  const diverted = new Set(report.circuits.flatMap(circuit => circuit.diverted));
  const picture = new Map([...engineRoomMotionOf(building)].filter(([id]) => !diverted.has(id)));
  pictures.set(report.used, picture);
  return picture;
}
