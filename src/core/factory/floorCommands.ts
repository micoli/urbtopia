import { FIXTURES } from '../venues/fixtures';
import { entranceCell } from '../venues/shared';
import { fixtureRefund, fixtureTiles } from '../venues/venues';
import { hireFeeOf } from '../venues/staff';
import { repairCost, restored } from '../venues/wear';
import type { CommandOutcome } from '../engine/commands';
import type { Building, FixtureId, FloorData, GameState, Rotation, VenueFixture, VenueType } from '../engine/state';
import type { FixtureVenue } from '../venues/fixtures';
import { isHomeType } from '../buildings/buildingDefinitions';
import { PARQUETS, canHangOnWall, hangsOnWall, homeFixtureRefund, homeGridSizeOf, isHomeInteriorUnlocked } from '../homes/homeInterior';
import { floorGridSizeOf, packhouseExitLimitOf, packhouseGridSizeOf } from './factoryFloor';
import { technicianPostsOf } from './floorWear';

export type Factory = Building & { type: 'factory' };

const EMPTY_FLOOR: FloorData = { fixtures: [], nextFixtureId: 1 };

export const isFactory = (building: Building): building is Factory => building.type === 'factory';

export type Packhouse = Building & { type: 'packhouse' };

export const isPackhouse = (building: Building): building is Packhouse => building.type === 'packhouse';

// A Factory, a Packhouse or a Home: the buildings that have a floor to fit out.
export const isFloorBuilding = (building: Building): boolean => building.type === 'factory' || building.type === 'packhouse' || isHomeType(building.type);

// What a floor building offers in its build menu: its kind of Fixtures.
export const floorKindOf = (building: Building): 'factory' | 'packhouse' | 'home' => (building.type === 'factory' ? 'factory' : building.type === 'packhouse' ? 'packhouse' : 'home');

// The kind of Fixtures a building takes: those of its Venue, of a Factory floor or of a Home interior.
export const fixtureVenueOf = (building: Building): FixtureVenue => (isFloorBuilding(building) ? floorKindOf(building) : (building.type as VenueType));

export const floorSizeOf = (building: Building): number => (building.type === 'factory' ? floorGridSizeOf(building.tier) : building.type === 'packhouse' ? packhouseGridSizeOf(building.tier) : homeGridSizeOf(building.tier));

const technicianHostOf = (state: GameState, buildingId: number): Building | undefined => {
  const building = state.buildings.find(candidate => candidate.id === buildingId);
  return building?.type === 'factory' || building?.type === 'packhouse' ? building : undefined;
};

type FloorHost = Building;

const hostOf = (state: GameState, buildingId: number): FloorHost | undefined => {
  const building = state.buildings.find(candidate => candidate.id === buildingId);
  return building && (building.type === 'factory' || building.type === 'packhouse' || isHomeType(building.type)) ? building : undefined;
};

const kindOf = floorKindOf;

const gridSizeOf = floorSizeOf;

const refundOf = (host: FloorHost, type: FixtureId): number => (host.type === 'factory' || host.type === 'packhouse' ? fixtureRefund(type) : homeFixtureRefund(type));

const floorOf = (host: FloorHost): FloorData => host.floor ?? EMPTY_FLOOR;

const startsALine = (type: FixtureId): boolean => FIXTURES[type].role === 'machine' && FIXTURES[type].lineOut !== undefined && FIXTURES[type].lineIn === undefined;

// The turns a Fixture of a Packhouse floor can take on a cell of the edge of a floor of a given size, with its back to that edge: a Packer stands against the back wall
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

export function canStandOnFloor(host: FloorHost, fixture: Pick<VenueFixture, 'type' | 'x' | 'y' | 'rotation'>, ignoreId?: number): boolean {
  const size = gridSizeOf(host);
  if (host.type === 'packhouse' && needsAWall(fixture.type) && !wallTurnsOf(fixture.type, fixture, size).includes(fixture.rotation)) return false;
  const entrance = entranceCell(host.tier);
  if (hangsOnWall(fixture.type)) return host.type !== 'factory' && canHangOnWall(floorOf(host).fixtures, fixture, size, entrance.x, ignoreId);
  const occupied = new Set(floorOf(host).fixtures.filter(other => other.id !== ignoreId && !hangsOnWall(other.type)).flatMap(fixtureTiles).map(tile => `${tile.x}:${tile.y}`));
  return fixtureTiles(fixture).every(tile => tile.x >= 0 && tile.y >= 0 && tile.x < size && tile.y < size && !occupied.has(`${tile.x}:${tile.y}`) && !(tile.x === entrance.x && tile.y === entrance.y));
}

const withFloor = (state: GameState, factory: FloorHost, floor: FloorData, urbs = state.urbs): GameState => ({
  ...state,
  urbs,
  buildings: state.buildings.map(candidate => (candidate === factory ? { ...factory, floor } : candidate)),
});

export function placeFloorFixture(state: GameState, buildingId: number, type: FixtureId, x: number, y: number, rotation: Rotation): CommandOutcome {
  const factory = hostOf(state, buildingId);
  if (!factory) return { key: 'error.unknownBuilding' };
  if (!(type in FIXTURES) || FIXTURES[type].venue !== kindOf(factory)) return { key: 'error.unknownCommand' };
  if (isHomeType(factory.type) && !isHomeInteriorUnlocked(state)) return { key: 'error.itemLocked' };
  if (factory.tier < FIXTURES[type].minTier) return { key: 'error.tierTooLow' };
  const fixture = { type, x, y, rotation };
  if (!canStandOnFloor(factory, fixture)) return { key: 'error.tilesOccupied' };
  if (FIXTURES[type].role === 'exit' && floorOf(factory).fixtures.filter(other => FIXTURES[other.type].packSize === FIXTURES[type].packSize).length >= packhouseExitLimitOf(factory.tier)) return { key: 'error.exitLimitReached' };
  const price = FIXTURES[type].price;
  if (state.urbs < price) return { key: 'error.notEnoughUrbs' };
  const floor = floorOf(factory);
  const placed: VenueFixture = { id: floor.nextFixtureId, ...fixture };
  return { state: withFloor(state, factory, { ...floor, fixtures: [...floor.fixtures, placed], nextFixtureId: floor.nextFixtureId + 1 }, state.urbs - price), events: [] };
}

const hungOn = (fixtures: readonly VenueFixture[], wall: VenueFixture): VenueFixture[] => (wall.type === 'homeWall' ? fixtures.filter(other => hangsOnWall(other.type) && other.x === wall.x && other.y === wall.y) : []);

// What hangs on a wall of the room goes with it: those paintings are taken down and refunded.
const withoutHungOn = (host: FloorHost, fixtures: readonly VenueFixture[], wall: VenueFixture): { fixtures: VenueFixture[]; refund: number } => {
  const hung = hungOn(fixtures, wall);
  return { fixtures: fixtures.filter(other => !hung.includes(other)), refund: hung.reduce((sum, other) => sum + refundOf(host, other.type), 0) };
};

// A moved wall carries its paintings, turned as it is; those that no longer find a face to hang on are taken down and refunded.
const carryingHung = (host: FloorHost, fixtures: readonly VenueFixture[], wall: VenueFixture, moved: VenueFixture): { fixtures: VenueFixture[]; refund: number } => {
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

export function moveFloorFixture(state: GameState, buildingId: number, fixtureId: number, x: number, y: number, rotation?: Rotation): CommandOutcome {
  const factory = hostOf(state, buildingId);
  if (!factory) return { key: 'error.unknownBuilding' };
  const floor = floorOf(factory);
  const fixture = floor.fixtures.find(candidate => candidate.id === fixtureId);
  if (!fixture) return { key: 'error.unknownFixture' };
  const moved: VenueFixture = { ...fixture, x, y, rotation: rotation ?? fixture.rotation };
  if (!canStandOnFloor(factory, moved, fixtureId)) return { key: 'error.tilesOccupied' };
  const relocated = floor.fixtures.map(candidate => (candidate === fixture ? moved : candidate));
  const taken = carryingHung(factory, relocated, fixture, moved);
  return { state: withFloor(state, factory, { ...floor, fixtures: taken.fixtures }, state.urbs + taken.refund), events: [] };
}

export function removeFloorFixture(state: GameState, buildingId: number, fixtureId: number): CommandOutcome {
  const factory = hostOf(state, buildingId);
  if (!factory) return { key: 'error.unknownBuilding' };
  const floor = floorOf(factory);
  const fixture = floor.fixtures.find(candidate => candidate.id === fixtureId);
  if (!fixture) return { key: 'error.unknownFixture' };
  const taken = withoutHungOn(factory, floor.fixtures.filter(candidate => candidate !== fixture), fixture);
  return { state: withFloor(state, factory, { ...floor, fixtures: taken.fixtures }, state.urbs + refundOf(factory, fixture.type) + taken.refund), events: [] };
}

// The floor of a Home interior is a free choice among the parquets.
export function setHomeParquet(state: GameState, buildingId: number, parquet: number): CommandOutcome {
  const home = hostOf(state, buildingId);
  if (!home || home.type === 'factory') return { key: 'error.unknownBuilding' };
  if (!isHomeInteriorUnlocked(state)) return { key: 'error.itemLocked' };
  if (!Number.isInteger(parquet) || parquet < 0 || parquet >= PARQUETS.length) return { key: 'error.unknownCommand' };
  return { state: withFloor(state, home, { ...floorOf(home), parquet }), events: [] };
}

export function repairFloorFixture(state: GameState, buildingId: number, fixtureId: number): CommandOutcome {
  const factory = hostOf(state, buildingId);
  if (!factory) return { key: 'error.unknownBuilding' };
  const floor = floorOf(factory);
  const fixture = floor.fixtures.find(candidate => candidate.id === fixtureId);
  if (!fixture) return { key: 'error.unknownFixture' };
  const cost = repairCost(fixture);
  if (cost === 0) return { key: 'error.nothingToRepair' };
  if (state.urbs < cost) return { key: 'error.notEnoughUrbs' };
  return { state: withFloor(state, factory, { ...floor, fixtures: floor.fixtures.map(candidate => (candidate === fixture ? restored(fixture) : candidate)) }, state.urbs - cost), events: [] };
}

export function hireFloorTechnician(state: GameState, buildingId: number): CommandOutcome {
  const factory = technicianHostOf(state, buildingId);
  if (!factory) return { key: 'error.unknownBuilding' };
  const floor = floorOf(factory);
  const hired = floor.technicians ?? 0;
  const posts = technicianPostsOf(factory.tier);
  if (posts === 0) return { key: 'error.tierTooLow' };
  if (hired >= posts) return { key: 'error.noStaffPost' };
  const fee = hireFeeOf('technician');
  if (state.urbs < fee) return { key: 'error.notEnoughUrbs' };
  return { state: withFloor(state, factory, { ...floor, technicians: hired + 1 }, state.urbs - fee), events: [] };
}

export function releaseFloorTechnician(state: GameState, buildingId: number): CommandOutcome {
  const factory = technicianHostOf(state, buildingId);
  if (!factory) return { key: 'error.unknownBuilding' };
  const floor = floorOf(factory);
  const hired = floor.technicians ?? 0;
  if (hired === 0) return { key: 'error.noStaffToRelease' };
  return { state: withFloor(state, factory, { ...floor, technicians: hired - 1 }), events: [] };
}
