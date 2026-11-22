import { FIXTURES, isRestockable } from '../venues/fixtures';
import { lineInSidesOf, lineOutSidesOf } from '../venues/fixturePorts';
import { entranceCell } from '../venues/shared';
import { isVenueType } from '../venues/profiles';
import { fixtureRefund, fixtureTiles } from '../venues/venues';
import { hireFeeOf } from '../venues/staff';
import { needsRepair, repairCost, restored } from '../venues/wear';
import type { CommandError, CommandOutcome } from '../engine/commands';
import type { Building, FixtureId, InteriorData, GameState, Rotation, VenueFixture, VenueType } from '../engine/state';
import type { FixtureVenue } from '../venues/fixtures';
import { isHomeType } from '../buildings/buildingDefinitions';
import { PRODUCTION_INTERIOR_KINDS, SERVICE_INTERIOR_KINDS } from '../venues/venueVocabulary';
import { isInteriorUnlocked } from '../interiors/interiorUnlock';
import { interiorProfileOf } from '../interiors/interiorProfile';
import { interiorFixtureKindOf } from '../interiors/interiorStaff';
import { withoutAssignment } from '../interiors/interiorAssignments';
import { fixtureLimitOf } from '../interiors/interiorLimits';
import { editInterior } from '../interiors/interiorEdit';
import { PARQUETS, canHangOnWall, hangsOnWall, homeFixtureRefund, homeGridSizeOf, isHomeInteriorUnlocked } from '../homes/homeInterior';
import { interiorFixturesOf } from './interiorLinks';
import { recyclingLimitsOf } from './recyclingGains';
import { packSizeOf, packhouseExitLimitOf } from './interiorBonus';
import { producibleItems, type GoodId } from '../economy/items';
import { isItemUnlocked } from '../progression/unlocks';
import { restockerPostsOf, technicianPostsOf } from './interiorWear';

export type Factory = Building & { type: 'factory' };

export const isFactory = (building: Building): building is Factory => building.type === 'factory';

export type Packhouse = Building & { type: 'packhouse' };

export const isPackhouse = (building: Building): building is Packhouse => building.type === 'packhouse';

export const isMill = (building: Building): boolean => building.type === 'mill';

// The Production interiors, which share the engine of the Factory interior.
export const hasProductionInterior = (building: Building): boolean => interiorProfileOf(building.type)?.family === 'production';

// A Packhouse, a Bakery, a Dairy or a Storehouse: the interiors where a Line of crates runs from a Machine against the wall to an Exit.
export const hasLineInterior = (building: Building): boolean => interiorProfileOf(building.type)?.line === true;

// A Power plant with an Engine room: its wall ports stand against the back wall, facing the room.
export const hasEngineRoom = (building: Building): boolean => interiorProfileOf(building.type)?.bonusModel === 'engineRoom';

// A School, a Library or a Hospital: the interiors that raise the quality of a service.
export const hasServiceInterior = (building: Building): boolean => interiorProfileOf(building.type)?.family === 'service';

export const isInteriorBuilding = (building: Building): boolean => interiorProfileOf(building.type) !== undefined;

// What a floor building offers in its build menu: its kind of Fixtures.
export const interiorKindOf = (building: Building): (typeof PRODUCTION_INTERIOR_KINDS)[number] | (typeof SERVICE_INTERIOR_KINDS)[number] | 'home' => {
  const family = interiorProfileOf(building.type)?.family;
  if (family === 'production' || family === 'service') return interiorFixtureKindOf(building.type) as (typeof PRODUCTION_INTERIOR_KINDS)[number] | (typeof SERVICE_INTERIOR_KINDS)[number];
  return 'home';
};

// The kind of Fixtures a building takes: those of its Venue, of a Factory interior or of a Home interior.
export const fixtureVenueOf = (building: Building): FixtureVenue => (isInteriorBuilding(building) ? interiorKindOf(building) : (building.type as VenueType));

export const interiorSizeOf = (building: Building): number => interiorProfileOf(building.type)?.gridSize(building.tier) ?? homeGridSizeOf(building.tier);

const refundOf = (host: Building, type: FixtureId): number => (hasProductionInterior(host) || hasServiceInterior(host) ? fixtureRefund(type) : homeFixtureRefund(type));

const startsALine = (type: FixtureId): boolean => FIXTURES[type].role === 'machine' && lineOutSidesOf(FIXTURES[type]).length > 0 && lineInSidesOf(FIXTURES[type]).length === 0;

// The turns a Fixture of a Packhouse interior can take on a cell of the edge of a floor of a given size, with its back to that edge: a Packer stands against the back wall
// only, an Exit against any of the four edges. None for a Fixture that stands anywhere, and none for a cell where it cannot stand.
// An Exit of the Packhouse or of the Recycling plant stands against a wall; the Exit of the other Line interiors, a Counter, stands anywhere.
export const fixtureWallOf = (type: FixtureId): 'back' | 'exterior' | 'wall' | undefined => {
  if (startsALine(type) || FIXTURES[type].wallPort === true) return 'back';
  if (FIXTURES[type].role === 'exit' && (FIXTURES[type].venue === 'packhouse' || FIXTURES[type].venue === 'recyclingPlant')) return 'exterior';
  return hangsOnWall(type) ? 'wall' : undefined;
};

const needsAWall = (type: FixtureId): boolean => fixtureWallOf(type) === 'back' || fixtureWallOf(type) === 'exterior';

const wallTurnsOf = (type: FixtureId, cell: { x: number; y: number }, size: number): readonly Rotation[] => {
  if (!needsAWall(type)) return [];
  const turns: Rotation[] = [];
  if (cell.y === 0) turns.push(0);
  if (cell.x === 0 && FIXTURES[type].role === 'exit') turns.push(3);
  if (cell.y === size - 1 && FIXTURES[type].role === 'exit') turns.push(2);
  if (cell.x === size - 1 && FIXTURES[type].role === 'exit') turns.push(1);
  return turns;
};

// The turn a Packer or an Exit takes when put on a cell, if it can stand there.
export const wallFacingOf = (type: FixtureId, cell: { x: number; y: number }, size: number): Rotation | undefined => wallTurnsOf(type, cell, size)[0];

export function canStandOnInterior(host: Building, fixture: Pick<VenueFixture, 'type' | 'x' | 'y' | 'rotation'>, ignoreId?: number): boolean {
  const size = interiorSizeOf(host);
  if ((hasLineInterior(host) || hasEngineRoom(host)) && needsAWall(fixture.type) && !wallTurnsOf(fixture.type, fixture, size).includes(fixture.rotation)) return false;
  const entrance = entranceCell(host.tier);
  if (hangsOnWall(fixture.type)) return host.type !== 'factory' && canHangOnWall(interiorFixturesOf(host), fixture, size, entrance.x, ignoreId);
  const occupied = new Set(interiorFixturesOf(host).filter(other => other.id !== ignoreId && !hangsOnWall(other.type)).flatMap(fixtureTiles).map(tile => `${tile.x}:${tile.y}`));
  return fixtureTiles(fixture).every(tile => tile.x >= 0 && tile.y >= 0 && tile.x < size && tile.y < size && !occupied.has(`${tile.x}:${tile.y}`));
}

// A Recycling interior takes as many Exits, Sorters and Recyclers as its Tier allows.
const recyclingLimitReached = (host: Building, type: FixtureId): boolean => {
  const limits = recyclingLimitsOf(host.tier);
  const family = FIXTURES[type].family;
  const kind = FIXTURES[type].role === 'exit' ? 'exits' : family === 'sorter' ? 'sorters' : family === 'shredder' || family === 'furnace' || family === 'crusher' ? 'recyclers' : undefined;
  if (!kind) return false;
  const placed = interiorFixturesOf(host).filter(other => (kind === 'exits' ? FIXTURES[other.type].role === 'exit' : kind === 'sorters' ? FIXTURES[other.type].family === 'sorter' : ['shredder', 'furnace', 'crusher'].includes(FIXTURES[other.type].family ?? ''))).length;
  return placed >= limits[kind];
};

export const placeInteriorFixture = (state: GameState, buildingId: number, type: FixtureId, x: number, y: number, rotation: Rotation): CommandOutcome =>
  editInterior(state, buildingId, isInteriorBuilding, (factory, interior) => {
    if (!(type in FIXTURES) || FIXTURES[type].venue !== interiorKindOf(factory)) return { key: 'error.unknownCommand' };
    if (isHomeType(factory.type) && !isHomeInteriorUnlocked(state)) return { key: 'error.itemLocked' };
    if (!isHomeType(factory.type) && !isInteriorUnlocked(state, factory.type)) return { key: 'error.itemLocked' };
    if (factory.tier < FIXTURES[type].minTier) return { key: 'error.tierTooLow' };
    const limit = fixtureLimitOf(factory, type);
    if (limit && limit.count >= limit.max) return { key: 'error.fixtureLimitReached' };
    const fixture = { type, x, y, rotation };
    if (!canStandOnInterior(factory, fixture)) return { key: 'error.tilesOccupied' };
    if (factory.type === 'packhouse' && FIXTURES[type].role === 'exit' && interior.fixtures.filter(other => FIXTURES[other.type].packSize === FIXTURES[type].packSize).length >= packhouseExitLimitOf(factory.tier)) return { key: 'error.exitLimitReached' };
    if (factory.type === 'recyclingPlant' && recyclingLimitReached(factory, type)) return { key: 'error.recyclingLimitReached' };
    const placed: VenueFixture = { id: interior.nextFixtureId, ...fixture };
    return { interior: { ...interior, fixtures: [...interior.fixtures, placed], nextFixtureId: interior.nextFixtureId + 1 }, urbs: -FIXTURES[type].price };
  });

const hungOn = (fixtures: readonly VenueFixture[], wall: VenueFixture): VenueFixture[] => (wall.type === 'homeWall' ? fixtures.filter(other => hangsOnWall(other.type) && other.x === wall.x && other.y === wall.y) : []);

// What hangs on a wall of the room goes with it: those paintings are taken down and refunded.
const withoutHungOn = (host: Building, fixtures: readonly VenueFixture[], wall: VenueFixture): { fixtures: VenueFixture[]; refund: number } => {
  const hung = hungOn(fixtures, wall);
  return { fixtures: fixtures.filter(other => !hung.includes(other)), refund: hung.reduce((sum, other) => sum + refundOf(host, other.type), 0) };
};

// A moved wall carries its paintings, turned as it is; those that no longer find a face to hang on are taken down and refunded.
const carryingHung = (host: Building, fixtures: readonly VenueFixture[], wall: VenueFixture, moved: VenueFixture): { fixtures: VenueFixture[]; refund: number } => {
  const hung = hungOn(fixtures, wall);
  if (hung.length === 0) return { fixtures: [...fixtures], refund: 0 };
  const turn = (moved.rotation - wall.rotation + 4) % 4;
  const carried = new Map(hung.map(painting => [painting, { ...painting, x: moved.x, y: moved.y, rotation: ((painting.rotation + turn) % 4) as Rotation }]));
  const relocated = fixtures.map(candidate => carried.get(candidate) ?? candidate);
  const entrance = entranceCell(host.tier);
  const kept = [...carried.values()].filter(painting => canHangOnWall(relocated, painting, interiorSizeOf(host), entrance.x, painting.id));
  const dropped = [...carried.values()].filter(painting => !kept.includes(painting));
  return { fixtures: relocated.filter(candidate => !dropped.includes(candidate)), refund: dropped.reduce((sum, painting) => sum + refundOf(host, painting.type), 0) };
};

export const moveInteriorFixture = (state: GameState, buildingId: number, fixtureId: number, x: number, y: number, rotation?: Rotation): CommandOutcome =>
  editInterior(state, buildingId, isInteriorBuilding, (factory, interior) => {
    const fixture = interior.fixtures.find(candidate => candidate.id === fixtureId);
    if (!fixture) return { key: 'error.unknownFixture' };
    const moved: VenueFixture = withoutAssignment(withoutRestocker({ ...fixture, x, y, rotation: rotation ?? fixture.rotation }));
    if (!canStandOnInterior(factory, moved, fixtureId)) return { key: 'error.tilesOccupied' };
    const relocated = interior.fixtures.map(candidate => (candidate === fixture ? moved : candidate));
    const taken = carryingHung(factory, relocated, fixture, moved);
    return { interior: { ...interior, fixtures: taken.fixtures }, urbs: taken.refund };
  });

export const removeInteriorFixture = (state: GameState, buildingId: number, fixtureId: number): CommandOutcome =>
  editInterior(state, buildingId, isInteriorBuilding, (factory, interior) => {
    const fixture = interior.fixtures.find(candidate => candidate.id === fixtureId);
    if (!fixture) return { key: 'error.unknownFixture' };
    const taken = withoutHungOn(factory, interior.fixtures.filter(candidate => candidate !== fixture), fixture);
    return { interior: { ...interior, fixtures: taken.fixtures }, urbs: refundOf(factory, fixture.type) + taken.refund };
  });

// The floor of an interior is a free choice among the parquets; none leaves the floor of its kind (the first parquet for a Home).
export const setInteriorParquet = (state: GameState, buildingId: number, parquet?: number): CommandOutcome =>
  editInterior(state, buildingId, isInteriorBuilding, (host, current) => {
    if (isHomeType(host.type) && !isHomeInteriorUnlocked(state)) return { key: 'error.itemLocked' };
    const interior = { ...current };
    delete interior.parquet;
    if (parquet === undefined) return { interior };
    if (!Number.isInteger(parquet) || parquet < 0 || parquet >= PARQUETS.length) return { key: 'error.unknownCommand' };
    return { interior: { ...interior, parquet } };
  });

// The breaker cuts all the power of a Production interior or a Venue: it draws none and runs nothing until it is switched back on.
export function setInteriorBreaker(state: GameState, buildingId: number, off: boolean): CommandOutcome {
  const building = state.buildings.find(candidate => candidate.id === buildingId);
  if (!building || !(hasProductionInterior(building) || isVenueType(building.type))) return { key: 'error.unknownBuilding' };
  const switched: Building = off ? { ...building, breakerOff: true } : { ...building, breakerOff: undefined };
  if (!off) delete switched.breakerOff;
  return { state: { ...state, buildings: state.buildings.map(candidate => (candidate === building ? switched : candidate)) }, events: [] };
}

export const repairInteriorFixture = (state: GameState, buildingId: number, fixtureId: number): CommandOutcome =>
  editInterior(state, buildingId, isInteriorBuilding, (_factory, interior) => {
    const fixture = interior.fixtures.find(candidate => candidate.id === fixtureId);
    if (!fixture) return { key: 'error.unknownFixture' };
    const cost = repairCost(fixture);
    if (cost === 0) return { key: 'error.nothingToRepair' };
    return { interior: { ...interior, fixtures: interior.fixtures.map(candidate => (candidate === fixture ? restored(fixture) : candidate)) }, urbs: -cost };
  });

// Repairs the Fixtures due for a repair one after the other, in the order they were placed, as far as the city's Urbs go.
export const repairAllInteriorFixtures = (state: GameState, buildingId: number): CommandOutcome =>
  editInterior(state, buildingId, isInteriorBuilding, (_factory, interior) => {
    const worn = interior.fixtures.filter(needsRepair);
    if (worn.length === 0) return { key: 'error.nothingToRepair' };
    let urbs = state.urbs;
    const repaired = new Set<number>();
    for (const fixture of worn) {
      const cost = repairCost(fixture);
      if (urbs < cost) break;
      urbs -= cost;
      repaired.add(fixture.id);
    }
    if (repaired.size === 0) return { key: 'error.notEnoughUrbs' };
    const fixtures = interior.fixtures.map(fixture => (repaired.has(fixture.id) ? restored(fixture) : fixture));
    return { interior: { ...interior, fixtures }, urbs: urbs - state.urbs };
  });

export const hireInteriorTechnician = (state: GameState, buildingId: number): CommandOutcome =>
  editInterior(state, buildingId, hasProductionInterior, (factory, interior) => {
    const hired = interior.technicians ?? 0;
    const posts = technicianPostsOf(factory.tier, factory.type);
    if (posts === 0) return { key: 'error.tierTooLow' };
    if (hired >= posts) return { key: 'error.noStaffPost' };
    return { interior: { ...interior, technicians: hired + 1 }, urbs: -hireFeeOf('technician') };
  });

export const releaseInteriorTechnician = (state: GameState, buildingId: number): CommandOutcome =>
  editInterior(state, buildingId, hasProductionInterior, (_factory, interior) => {
    const hired = interior.technicians ?? 0;
    if (hired === 0) return { key: 'error.noStaffToRelease' };
    return { interior: { ...interior, technicians: hired - 1 } };
  });

// A Packhouse and a Factory have Restockers: the first serves its Exits, the second its Machines.
const hasExitRestockers = (building: Building): boolean => building.type === 'packhouse' || building.type === 'factory';

export const hireInteriorRestocker = (state: GameState, buildingId: number): CommandOutcome =>
  editInterior(state, buildingId, hasExitRestockers, (packhouse, interior) => {
    const hired = interior.restockers ?? 0;
    const posts = restockerPostsOf(packhouse.tier, packhouse.type);
    if (posts === 0) return { key: 'error.tierTooLow' };
    if (hired >= posts) return { key: 'error.noStaffPost' };
    return { interior: { ...interior, restockers: hired + 1 }, urbs: -hireFeeOf('restocker') };
  });

export const releaseInteriorRestocker = (state: GameState, buildingId: number): CommandOutcome =>
  editInterior(state, buildingId, hasExitRestockers, (_packhouse, interior) => {
    const hired = interior.restockers ?? 0;
    if (hired === 0) return { key: 'error.noStaffToRelease' };
    const assigned = interior.fixtures.filter(fixture => fixture.restocker).sort((a, b) => b.id - a.id);
    const freed = assigned.length >= hired ? assigned[0] : undefined;
    const fixtures = freed ? interior.fixtures.map(fixture => (fixture === freed ? withoutRestocker(fixture) : fixture)) : interior.fixtures;
    return { interior: { ...interior, fixtures, restockers: hired - 1 } };
  });

const without = (fixture: VenueFixture, ...fields: (keyof VenueFixture)[]): VenueFixture => Object.fromEntries(Object.entries(fixture).filter(([field]) => !fields.includes(field as keyof VenueFixture))) as unknown as VenueFixture;

const withoutRestocker = (fixture: VenueFixture): VenueFixture => without(fixture, 'restocker');

const exitOf = (interior: InteriorData, fixtureId: number): VenueFixture | CommandError => {
  const fixture = interior.fixtures.find(candidate => candidate.id === fixtureId);
  if (!fixture) return { key: 'error.unknownFixture' };
  return isRestockable(FIXTURES[fixture.type]) ? fixture : { key: 'error.notAnExit' };
};

const withReplacedFixture = (interior: InteriorData, replacement: VenueFixture): InteriorData => ({ ...interior, fixtures: interior.fixtures.map(fixture => (fixture.id === replacement.id ? replacement : fixture)) });

export const setExitRestock = (state: GameState, buildingId: number, fixtureId: number, good: GoodId | null): CommandOutcome =>
  editInterior(state, buildingId, hasExitRestockers, (packhouse, interior) => {
    const exit = exitOf(interior, fixtureId);
    if ('key' in exit) return exit;
    if (good === null) return { interior: withReplacedFixture(interior, without(exit, 'restock', 'restocker')) };
    if (!producibleItems(packhouse.type).includes(good)) return { key: 'error.cannotProduce' };
    if (packhouse.type === 'packhouse' && packSizeOf(good) !== FIXTURES[exit.type].packSize) return { key: 'error.wrongPackSize' };
    if (!isItemUnlocked(state, good)) return { key: 'error.itemLocked' };
    return { interior: withReplacedFixture(interior, { ...exit, restock: good }) };
  });

export const assignInteriorRestocker = (state: GameState, buildingId: number, fixtureId: number): CommandOutcome =>
  editInterior(state, buildingId, hasExitRestockers, (_packhouse, interior) => {
    const exit = exitOf(interior, fixtureId);
    if ('key' in exit) return exit;
    if (!exit.restock) return { key: 'error.noRestock' };
    if (exit.restocker) return { key: 'error.restockerAlreadyAssigned' };
    if (interior.fixtures.filter(fixture => fixture.restocker).length >= (interior.restockers ?? 0)) return { key: 'error.noFreeRestocker' };
    return { interior: withReplacedFixture(interior, { ...exit, restocker: true }) };
  });

export const unassignInteriorRestocker = (state: GameState, buildingId: number, fixtureId: number): CommandOutcome =>
  editInterior(state, buildingId, hasExitRestockers, (_packhouse, interior) => {
    const exit = exitOf(interior, fixtureId);
    if ('key' in exit) return exit;
    if (!exit.restocker) return { key: 'error.noRestockerAssigned' };
    return { interior: withReplacedFixture(interior, withoutRestocker(exit)) };
  });
