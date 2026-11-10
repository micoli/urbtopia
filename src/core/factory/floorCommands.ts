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
import { floorGridSizeOf } from './factoryFloor';
import { technicianPostsOf } from './floorWear';

export type Factory = Building & { type: 'factory' };

const EMPTY_FLOOR: FloorData = { fixtures: [], nextFixtureId: 1 };

export const isFactory = (building: Building): building is Factory => building.type === 'factory';

// A Factory or a Home: the buildings that have a floor to fit out.
export const isFloorBuilding = (building: Building): boolean => building.type === 'factory' || isHomeType(building.type);

// What a floor building offers in its build menu: its kind of Fixtures.
export const floorKindOf = (building: Building): 'factory' | 'home' => (building.type === 'factory' ? 'factory' : 'home');

// The kind of Fixtures a building takes: those of its Venue, of a Factory floor or of a Home interior.
export const fixtureVenueOf = (building: Building): FixtureVenue => (isFloorBuilding(building) ? floorKindOf(building) : (building.type as VenueType));

export const floorSizeOf = (building: Building): number => (building.type === 'factory' ? floorGridSizeOf(building.tier) : homeGridSizeOf(building.tier));

const factoryOf = (state: GameState, buildingId: number): Factory | undefined => {
  const building = state.buildings.find(candidate => candidate.id === buildingId);
  return building?.type === 'factory' ? (building as Factory) : undefined;
};

type FloorHost = Building;

const hostOf = (state: GameState, buildingId: number): FloorHost | undefined => {
  const building = state.buildings.find(candidate => candidate.id === buildingId);
  return building && (building.type === 'factory' || isHomeType(building.type)) ? building : undefined;
};

const kindOf = floorKindOf;

const gridSizeOf = floorSizeOf;

const refundOf = (host: FloorHost, type: FixtureId): number => (host.type === 'factory' ? fixtureRefund(type) : homeFixtureRefund(type));

const floorOf = (host: FloorHost): FloorData => host.floor ?? EMPTY_FLOOR;

export function canStandOnFloor(host: FloorHost, fixture: Pick<VenueFixture, 'type' | 'x' | 'y' | 'rotation'>, ignoreId?: number): boolean {
  const size = gridSizeOf(host);
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
  if (factory.type !== 'factory' && !isHomeInteriorUnlocked(state)) return { key: 'error.itemLocked' };
  if (factory.tier < FIXTURES[type].minTier) return { key: 'error.tierTooLow' };
  const fixture = { type, x, y, rotation };
  if (!canStandOnFloor(factory, fixture)) return { key: 'error.tilesOccupied' };
  const price = FIXTURES[type].price;
  if (state.urbs < price) return { key: 'error.notEnoughUrbs' };
  const floor = floorOf(factory);
  const placed: VenueFixture = { id: floor.nextFixtureId, ...fixture };
  return { state: withFloor(state, factory, { ...floor, fixtures: [...floor.fixtures, placed], nextFixtureId: floor.nextFixtureId + 1 }, state.urbs - price), events: [] };
}

export function moveFloorFixture(state: GameState, buildingId: number, fixtureId: number, x: number, y: number, rotation?: Rotation): CommandOutcome {
  const factory = hostOf(state, buildingId);
  if (!factory) return { key: 'error.unknownBuilding' };
  const floor = floorOf(factory);
  const fixture = floor.fixtures.find(candidate => candidate.id === fixtureId);
  if (!fixture) return { key: 'error.unknownFixture' };
  const moved: VenueFixture = { ...fixture, x, y, rotation: rotation ?? fixture.rotation };
  if (!canStandOnFloor(factory, moved, fixtureId)) return { key: 'error.tilesOccupied' };
  return { state: withFloor(state, factory, { ...floor, fixtures: floor.fixtures.map(candidate => (candidate === fixture ? moved : candidate)) }), events: [] };
}

export function removeFloorFixture(state: GameState, buildingId: number, fixtureId: number): CommandOutcome {
  const factory = hostOf(state, buildingId);
  if (!factory) return { key: 'error.unknownBuilding' };
  const floor = floorOf(factory);
  const fixture = floor.fixtures.find(candidate => candidate.id === fixtureId);
  if (!fixture) return { key: 'error.unknownFixture' };
  return { state: withFloor(state, factory, { ...floor, fixtures: floor.fixtures.filter(candidate => candidate !== fixture) }, state.urbs + refundOf(factory, fixture.type)), events: [] };
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
  const factory = factoryOf(state, buildingId);
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
  const factory = factoryOf(state, buildingId);
  if (!factory) return { key: 'error.unknownBuilding' };
  const floor = floorOf(factory);
  const hired = floor.technicians ?? 0;
  if (hired === 0) return { key: 'error.noStaffToRelease' };
  return { state: withFloor(state, factory, { ...floor, technicians: hired - 1 }), events: [] };
}
