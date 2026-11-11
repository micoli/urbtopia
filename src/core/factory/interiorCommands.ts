import { FIXTURES } from '../venues/fixtures';
import { entranceCell } from '../venues/shared';
import { fixtureRefund, fixtureTiles } from '../venues/venues';
import { hireFeeOf } from '../venues/staff';
import { repairCost, restored } from '../venues/wear';
import type { CommandError, CommandOutcome } from '../engine/commands';
import type { Building, FixtureId, InteriorData, GameState, Rotation, VenueFixture, VenueType } from '../engine/state';
import type { FixtureVenue } from '../venues/fixtures';
import { isHomeType } from '../buildings/buildingDefinitions';
import { PRODUCTION_INTERIOR_KINDS } from '../venues/venueVocabulary';
import { interiorLayoutOf } from '../interiors/interiorStaff';
import { PARQUETS, canHangOnWall, hangsOnWall, homeFixtureRefund, homeGridSizeOf, isHomeInteriorUnlocked } from '../homes/homeInterior';
import { interiorGridSizeOf, interiorGridSizeOfType, packSizeOf, packhouseExitLimitOf, packhouseGridSizeOf } from './factoryInterior';
import { producibleItems, type GoodId } from '../economy/items';
import { isItemUnlocked } from '../progression/unlocks';
import { restockerPostsOf, technicianPostsOf } from './interiorWear';

export type Factory = Building & { type: 'factory' };

const EMPTY_INTERIOR: InteriorData = { fixtures: [], nextFixtureId: 1 };

export const isFactory = (building: Building): building is Factory => building.type === 'factory';

export type Packhouse = Building & { type: 'packhouse' };

export const isPackhouse = (building: Building): building is Packhouse => building.type === 'packhouse';

// A Factory, a Packhouse or a Home: the buildings that have a floor to fit out.
export const isMill = (building: Building): boolean => building.type === 'mill';

// The Production interiors, which share the engine of the Factory interior.
export const hasProductionInterior = (building: Building): boolean => (PRODUCTION_INTERIOR_KINDS as readonly string[]).includes(building.type);

// A Packhouse, a Bakery, a Dairy or a Storehouse: the interiors where a Line of crates runs from a Machine against the wall to an Exit.
export const hasLineInterior = (building: Building): boolean => building.type === 'packhouse' || interiorLayoutOf(building.type)?.line === true;

export const isInteriorBuilding = (building: Building): boolean => hasProductionInterior(building) || isHomeType(building.type);

// What a floor building offers in its build menu: its kind of Fixtures.
export const interiorKindOf = (building: Building): (typeof PRODUCTION_INTERIOR_KINDS)[number] | 'home' => (hasProductionInterior(building) ? (building.type as (typeof PRODUCTION_INTERIOR_KINDS)[number]) : 'home');

// The kind of Fixtures a building takes: those of its Venue, of a Factory interior or of a Home interior.
export const fixtureVenueOf = (building: Building): FixtureVenue => (isInteriorBuilding(building) ? interiorKindOf(building) : (building.type as VenueType));

export const interiorSizeOf = (building: Building): number => (building.type === 'factory' ? interiorGridSizeOf(building.tier) : building.type === 'packhouse' ? packhouseGridSizeOf(building.tier) : hasProductionInterior(building) ? interiorGridSizeOfType(building.type, building.tier) : homeGridSizeOf(building.tier));

const technicianHostOf = (state: GameState, buildingId: number): Building | undefined => {
  const building = state.buildings.find(candidate => candidate.id === buildingId);
  return building && hasProductionInterior(building) ? building : undefined;
};

type InteriorHost = Building;

const hostOf = (state: GameState, buildingId: number): InteriorHost | undefined => {
  const building = state.buildings.find(candidate => candidate.id === buildingId);
  return building && isInteriorBuilding(building) ? building : undefined;
};

const kindOf = interiorKindOf;

const gridSizeOf = interiorSizeOf;

const refundOf = (host: InteriorHost, type: FixtureId): number => (hasProductionInterior(host) ? fixtureRefund(type) : homeFixtureRefund(type));

const interiorOf = (host: InteriorHost): InteriorData => host.interior ?? EMPTY_INTERIOR;

const startsALine = (type: FixtureId): boolean => FIXTURES[type].role === 'machine' && FIXTURES[type].lineOut !== undefined && FIXTURES[type].lineIn === undefined;

// The turns a Fixture of a Packhouse interior can take on a cell of the edge of a floor of a given size, with its back to that edge: a Packer stands against the back wall
// only, an Exit against any of the four edges. None for a Fixture that stands anywhere, and none for a cell where it cannot stand.
const wallTurnsOf = (type: FixtureId, cell: { x: number; y: number }, size: number): readonly Rotation[] => {
  if (FIXTURES[type].role !== 'exit' && !startsALine(type)) return [];
  const turns: Rotation[] = [];
  if (cell.y === 0) turns.push(0);
  if (cell.x === 0 && FIXTURES[type].role === 'exit') turns.push(3);
  if (cell.y === size - 1 && FIXTURES[type].role === 'exit') turns.push(2);
  if (cell.x === size - 1 && FIXTURES[type].role === 'exit') turns.push(1);
  return turns;
};

// The turn a Packer or an Exit takes when put on a cell, if it can stand there.
export const wallFacingOf = (type: FixtureId, cell: { x: number; y: number }, size: number): Rotation | undefined => wallTurnsOf(type, cell, size)[0];

const needsAWall = (type: FixtureId): boolean => FIXTURES[type].role === 'exit' || startsALine(type);

export function canStandOnInterior(host: InteriorHost, fixture: Pick<VenueFixture, 'type' | 'x' | 'y' | 'rotation'>, ignoreId?: number): boolean {
  const size = gridSizeOf(host);
  if (hasLineInterior(host) && needsAWall(fixture.type) && !wallTurnsOf(fixture.type, fixture, size).includes(fixture.rotation)) return false;
  const entrance = entranceCell(host.tier);
  if (hangsOnWall(fixture.type)) return host.type !== 'factory' && canHangOnWall(interiorOf(host).fixtures, fixture, size, entrance.x, ignoreId);
  const occupied = new Set(interiorOf(host).fixtures.filter(other => other.id !== ignoreId && !hangsOnWall(other.type)).flatMap(fixtureTiles).map(tile => `${tile.x}:${tile.y}`));
  return fixtureTiles(fixture).every(tile => tile.x >= 0 && tile.y >= 0 && tile.x < size && tile.y < size && !occupied.has(`${tile.x}:${tile.y}`) && !(tile.x === entrance.x && tile.y === entrance.y));
}

const withInterior = (state: GameState, factory: InteriorHost, interior: InteriorData, urbs = state.urbs): GameState => ({
  ...state,
  urbs,
  buildings: state.buildings.map(candidate => (candidate === factory ? { ...factory, interior } : candidate)),
});

export function placeInteriorFixture(state: GameState, buildingId: number, type: FixtureId, x: number, y: number, rotation: Rotation): CommandOutcome {
  const factory = hostOf(state, buildingId);
  if (!factory) return { key: 'error.unknownBuilding' };
  if (!(type in FIXTURES) || FIXTURES[type].venue !== kindOf(factory)) return { key: 'error.unknownCommand' };
  if (isHomeType(factory.type) && !isHomeInteriorUnlocked(state)) return { key: 'error.itemLocked' };
  if (factory.tier < FIXTURES[type].minTier) return { key: 'error.tierTooLow' };
  const fixture = { type, x, y, rotation };
  if (!canStandOnInterior(factory, fixture)) return { key: 'error.tilesOccupied' };
  if (factory.type === 'packhouse' && FIXTURES[type].role === 'exit' && interiorOf(factory).fixtures.filter(other => FIXTURES[other.type].packSize === FIXTURES[type].packSize).length >= packhouseExitLimitOf(factory.tier)) return { key: 'error.exitLimitReached' };
  const price = FIXTURES[type].price;
  if (state.urbs < price) return { key: 'error.notEnoughUrbs' };
  const interior = interiorOf(factory);
  const placed: VenueFixture = { id: interior.nextFixtureId, ...fixture };
  return { state: withInterior(state, factory, { ...interior, fixtures: [...interior.fixtures, placed], nextFixtureId: interior.nextFixtureId + 1 }, state.urbs - price), events: [] };
}

const hungOn = (fixtures: readonly VenueFixture[], wall: VenueFixture): VenueFixture[] => (wall.type === 'homeWall' ? fixtures.filter(other => hangsOnWall(other.type) && other.x === wall.x && other.y === wall.y) : []);

// What hangs on a wall of the room goes with it: those paintings are taken down and refunded.
const withoutHungOn = (host: InteriorHost, fixtures: readonly VenueFixture[], wall: VenueFixture): { fixtures: VenueFixture[]; refund: number } => {
  const hung = hungOn(fixtures, wall);
  return { fixtures: fixtures.filter(other => !hung.includes(other)), refund: hung.reduce((sum, other) => sum + refundOf(host, other.type), 0) };
};

// A moved wall carries its paintings, turned as it is; those that no longer find a face to hang on are taken down and refunded.
const carryingHung = (host: InteriorHost, fixtures: readonly VenueFixture[], wall: VenueFixture, moved: VenueFixture): { fixtures: VenueFixture[]; refund: number } => {
  const hung = hungOn(fixtures, wall);
  if (hung.length === 0) return { fixtures: [...fixtures], refund: 0 };
  const turn = (moved.rotation - wall.rotation + 4) % 4;
  const carried = new Map(hung.map(painting => [painting, { ...painting, x: moved.x, y: moved.y, rotation: ((painting.rotation + turn) % 4) as Rotation }]));
  const relocated = fixtures.map(candidate => carried.get(candidate) ?? candidate);
  const entrance = entranceCell(host.tier);
  const kept = [...carried.values()].filter(painting => canHangOnWall(relocated, painting, gridSizeOf(host), entrance.x, painting.id));
  const dropped = [...carried.values()].filter(painting => !kept.includes(painting));
  return { fixtures: relocated.filter(candidate => !dropped.includes(candidate)), refund: dropped.reduce((sum, painting) => sum + refundOf(host, painting.type), 0) };
};

export function moveInteriorFixture(state: GameState, buildingId: number, fixtureId: number, x: number, y: number, rotation?: Rotation): CommandOutcome {
  const factory = hostOf(state, buildingId);
  if (!factory) return { key: 'error.unknownBuilding' };
  const interior = interiorOf(factory);
  const fixture = interior.fixtures.find(candidate => candidate.id === fixtureId);
  if (!fixture) return { key: 'error.unknownFixture' };
  const moved: VenueFixture = withoutRestocker({ ...fixture, x, y, rotation: rotation ?? fixture.rotation });
  if (!canStandOnInterior(factory, moved, fixtureId)) return { key: 'error.tilesOccupied' };
  const relocated = interior.fixtures.map(candidate => (candidate === fixture ? moved : candidate));
  const taken = carryingHung(factory, relocated, fixture, moved);
  return { state: withInterior(state, factory, { ...interior, fixtures: taken.fixtures }, state.urbs + taken.refund), events: [] };
}

export function removeInteriorFixture(state: GameState, buildingId: number, fixtureId: number): CommandOutcome {
  const factory = hostOf(state, buildingId);
  if (!factory) return { key: 'error.unknownBuilding' };
  const interior = interiorOf(factory);
  const fixture = interior.fixtures.find(candidate => candidate.id === fixtureId);
  if (!fixture) return { key: 'error.unknownFixture' };
  const taken = withoutHungOn(factory, interior.fixtures.filter(candidate => candidate !== fixture), fixture);
  return { state: withInterior(state, factory, { ...interior, fixtures: taken.fixtures }, state.urbs + refundOf(factory, fixture.type) + taken.refund), events: [] };
}

// The floor of a Home interior is a free choice among the parquets.
export function setHomeParquet(state: GameState, buildingId: number, parquet: number): CommandOutcome {
  const home = hostOf(state, buildingId);
  if (!home || home.type === 'factory') return { key: 'error.unknownBuilding' };
  if (!isHomeInteriorUnlocked(state)) return { key: 'error.itemLocked' };
  if (!Number.isInteger(parquet) || parquet < 0 || parquet >= PARQUETS.length) return { key: 'error.unknownCommand' };
  return { state: withInterior(state, home, { ...interiorOf(home), parquet }), events: [] };
}

export function repairInteriorFixture(state: GameState, buildingId: number, fixtureId: number): CommandOutcome {
  const factory = hostOf(state, buildingId);
  if (!factory) return { key: 'error.unknownBuilding' };
  const interior = interiorOf(factory);
  const fixture = interior.fixtures.find(candidate => candidate.id === fixtureId);
  if (!fixture) return { key: 'error.unknownFixture' };
  const cost = repairCost(fixture);
  if (cost === 0) return { key: 'error.nothingToRepair' };
  if (state.urbs < cost) return { key: 'error.notEnoughUrbs' };
  return { state: withInterior(state, factory, { ...interior, fixtures: interior.fixtures.map(candidate => (candidate === fixture ? restored(fixture) : candidate)) }, state.urbs - cost), events: [] };
}

export function hireInteriorTechnician(state: GameState, buildingId: number): CommandOutcome {
  const factory = technicianHostOf(state, buildingId);
  if (!factory) return { key: 'error.unknownBuilding' };
  const interior = interiorOf(factory);
  const hired = interior.technicians ?? 0;
  const posts = technicianPostsOf(factory.tier, factory.type);
  if (posts === 0) return { key: 'error.tierTooLow' };
  if (hired >= posts) return { key: 'error.noStaffPost' };
  const fee = hireFeeOf('technician');
  if (state.urbs < fee) return { key: 'error.notEnoughUrbs' };
  return { state: withInterior(state, factory, { ...interior, technicians: hired + 1 }, state.urbs - fee), events: [] };
}

export function releaseInteriorTechnician(state: GameState, buildingId: number): CommandOutcome {
  const factory = technicianHostOf(state, buildingId);
  if (!factory) return { key: 'error.unknownBuilding' };
  const interior = interiorOf(factory);
  const hired = interior.technicians ?? 0;
  if (hired === 0) return { key: 'error.noStaffToRelease' };
  return { state: withInterior(state, factory, { ...interior, technicians: hired - 1 }), events: [] };
}

const packhouseOf = (state: GameState, buildingId: number): Building | undefined => {
  const building = state.buildings.find(candidate => candidate.id === buildingId);
  return building?.type === 'packhouse' ? building : undefined;
};

export function hireInteriorRestocker(state: GameState, buildingId: number): CommandOutcome {
  const packhouse = packhouseOf(state, buildingId);
  if (!packhouse) return { key: 'error.unknownBuilding' };
  const interior = interiorOf(packhouse);
  const hired = interior.restockers ?? 0;
  const posts = restockerPostsOf(packhouse.tier);
  if (posts === 0) return { key: 'error.tierTooLow' };
  if (hired >= posts) return { key: 'error.noStaffPost' };
  const fee = hireFeeOf('restocker');
  if (state.urbs < fee) return { key: 'error.notEnoughUrbs' };
  return { state: withInterior(state, packhouse, { ...interior, restockers: hired + 1 }, state.urbs - fee), events: [] };
}

export function releaseInteriorRestocker(state: GameState, buildingId: number): CommandOutcome {
  const packhouse = packhouseOf(state, buildingId);
  if (!packhouse) return { key: 'error.unknownBuilding' };
  const interior = interiorOf(packhouse);
  const hired = interior.restockers ?? 0;
  if (hired === 0) return { key: 'error.noStaffToRelease' };
  const assigned = interior.fixtures.filter(fixture => fixture.restocker).sort((a, b) => b.id - a.id);
  const freed = assigned.length >= hired ? assigned[0] : undefined;
  const fixtures = freed ? interior.fixtures.map(fixture => (fixture === freed ? withoutRestocker(fixture) : fixture)) : interior.fixtures;
  return { state: withInterior(state, packhouse, { ...interior, fixtures, restockers: hired - 1 }), events: [] };
}

const without = (fixture: VenueFixture, ...fields: (keyof VenueFixture)[]): VenueFixture => Object.fromEntries(Object.entries(fixture).filter(([field]) => !fields.includes(field as keyof VenueFixture))) as unknown as VenueFixture;

const withoutRestocker = (fixture: VenueFixture): VenueFixture => without(fixture, 'restocker');

const exitOf = (interior: InteriorData, fixtureId: number): VenueFixture | CommandError => {
  const fixture = interior.fixtures.find(candidate => candidate.id === fixtureId);
  if (!fixture) return { key: 'error.unknownFixture' };
  return FIXTURES[fixture.type].role === 'exit' ? fixture : { key: 'error.notAnExit' };
};

const withFixture = (state: GameState, packhouse: Building, replacement: VenueFixture): CommandOutcome => {
  const interior = interiorOf(packhouse);
  return { state: withInterior(state, packhouse, { ...interior, fixtures: interior.fixtures.map(fixture => (fixture.id === replacement.id ? replacement : fixture)) }), events: [] };
};

export function setExitRestock(state: GameState, buildingId: number, fixtureId: number, good: GoodId | null): CommandOutcome {
  const packhouse = packhouseOf(state, buildingId);
  if (!packhouse) return { key: 'error.unknownBuilding' };
  const exit = exitOf(interiorOf(packhouse), fixtureId);
  if ('key' in exit) return exit;
  if (good === null) {
    return withFixture(state, packhouse, without(exit, 'restock', 'restocker'));
  }
  if (!producibleItems('packhouse').includes(good)) return { key: 'error.cannotProduce' };
  if (packSizeOf(good) !== FIXTURES[exit.type].packSize) return { key: 'error.wrongPackSize' };
  if (!isItemUnlocked(state, good)) return { key: 'error.itemLocked' };
  return withFixture(state, packhouse, { ...exit, restock: good });
}

export function assignInteriorRestocker(state: GameState, buildingId: number, fixtureId: number): CommandOutcome {
  const packhouse = packhouseOf(state, buildingId);
  if (!packhouse) return { key: 'error.unknownBuilding' };
  const interior = interiorOf(packhouse);
  const exit = exitOf(interior, fixtureId);
  if ('key' in exit) return exit;
  if (!exit.restock) return { key: 'error.noRestock' };
  if (exit.restocker) return { key: 'error.restockerAlreadyAssigned' };
  if (interior.fixtures.filter(fixture => fixture.restocker).length >= (interior.restockers ?? 0)) return { key: 'error.noFreeRestocker' };
  return withFixture(state, packhouse, { ...exit, restocker: true });
}

export function unassignInteriorRestocker(state: GameState, buildingId: number, fixtureId: number): CommandOutcome {
  const packhouse = packhouseOf(state, buildingId);
  if (!packhouse) return { key: 'error.unknownBuilding' };
  const exit = exitOf(interiorOf(packhouse), fixtureId);
  if ('key' in exit) return exit;
  if (!exit.restocker) return { key: 'error.noRestockerAssigned' };
  return withFixture(state, packhouse, withoutRestocker(exit));
}
