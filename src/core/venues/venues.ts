import { ARCADE_FIXTURES } from './fixtures';
import { citizensOf } from '../buildings/city';
import { centerOf } from '../environment/ecology';
import { isWithinReach } from '../services/facilities';
import type { CommandOutcome } from '../engine/commands';
import type { ArcadeFixtureId, Building, GameState, Rotation, VenueData, VenueFixture } from '../engine/state';

export const VENUE = {
  hourMs: 3_600_000,
  reachRadius: 12,
  visitorsPerCitizenPerHour: 0.2,
  playPrice: 2,
  minPrice: 1,
  maxPrice: 6,
  priceTolerance: 0.2,
  withoutCounterRate: 0.5,
  takingsCaps: [400, 900, 1800] as readonly number[],
  gridSizes: [6] as readonly number[],
  refundRatio: 0.5,
};

export { ARCADE_FIXTURES, ARCADE_FIXTURE_IDS, type FixtureSpec } from './fixtures';

export const entranceCell = (tier: number): { x: number; y: number } => ({ x: Math.floor(gridSizeOf(tier) / 2), y: 0 });

export const isVenue = (building: Building): building is Building & { venue: VenueData } => building.venue !== undefined;

export const gridSizeOf = (tier: number): number => VENUE.gridSizes[tier - 1] ?? VENUE.gridSizes[0]!;

export function fixtureFootprint(type: ArcadeFixtureId, rotation: Rotation): { width: number; depth: number } {
  const [width, depth] = ARCADE_FIXTURES[type].footprint;
  return rotation % 2 === 0 ? { width, depth } : { width: depth, depth: width };
}

export function fixtureTiles(fixture: Pick<VenueFixture, 'type' | 'x' | 'y' | 'rotation'>): { x: number; y: number }[] {
  const { width, depth } = fixtureFootprint(fixture.type, fixture.rotation);
  return Array.from({ length: width * depth }, (_, index) => ({ x: fixture.x + (index % width), y: fixture.y + Math.floor(index / width) }));
}

export const takingsCapOf = (tier: number): number => VENUE.takingsCaps[tier - 1] ?? VENUE.takingsCaps[VENUE.takingsCaps.length - 1]!;

export const priceOf = (venue: VenueData): number => venue.price ?? VENUE.playPrice;

export function visitorsPerHour(state: GameState, venue: Building): number {
  const to = centerOf(venue);
  const citizens = state.buildings.reduce((total, home) => {
    if (home.type !== 'home') return total;
    const from = centerOf(home);
    return isWithinReach(from.x - to.x, from.y - to.y, VENUE.reachRadius) ? total + citizensOf(home.tier) : total;
  }, 0);
  return citizens * VENUE.visitorsPerCitizenPerHour;
}

export function playsCapacityPerHour(venue: VenueData): number {
  return venue.fixtures.reduce((total, fixture) => total + ARCADE_FIXTURES[fixture.type].playsPerHour, 0);
}

export const priceAcceptance = (price: number): number => Math.min(1, Math.max(0, 1 - VENUE.priceTolerance * (price - VENUE.playPrice)));

export const serviceRateOf = (venue: VenueData): number => venue.fixtures.some(fixture => fixture.type === 'counter') ? 1 : VENUE.withoutCounterRate;

export interface VenuePerformance {
  visitors: number;
  accepted: number;
  capacity: number;
  served: number;
  earningsPerHour: number;
  earningsByFixture: ReadonlyMap<number, number>;
}

export function venuePerformance(state: GameState, venue: Building & { venue: VenueData }): VenuePerformance {
  const price = priceOf(venue.venue);
  const visitors = visitorsPerHour(state, venue);
  const accepted = visitors * priceAcceptance(price);
  const capacity = playsCapacityPerHour(venue.venue) * serviceRateOf(venue.venue);
  const served = Math.min(accepted, capacity);
  const earningsByFixture = new Map<number, number>();
  if (capacity > 0) {
    for (const fixture of venue.venue.fixtures) {
      const share = ARCADE_FIXTURES[fixture.type].playsPerHour * serviceRateOf(venue.venue) / capacity;
      if (share > 0) earningsByFixture.set(fixture.id, served * share * price);
    }
  }
  return { visitors, accepted, capacity, served, earningsPerHour: served * price, earningsByFixture };
}

export const takingsPerHour = (state: GameState, venue: Building & { venue: VenueData }): number => venuePerformance(state, venue).earningsPerHour;

export function advanceVenues(state: GameState, elapsedMs: number): GameState {
  if (elapsedMs <= 0 || !state.buildings.some(isVenue)) return state;
  return {
    ...state,
    buildings: state.buildings.map(building => {
      if (!isVenue(building)) return building;
      const takings = Math.min(takingsCapOf(building.tier), building.venue.takings + takingsPerHour(state, building) * elapsedMs / VENUE.hourMs);
      return takings === building.venue.takings ? building : { ...building, venue: { ...building.venue, takings } };
    }),
  };
}

export const takingsDue = (venue: VenueData): number => Math.floor(venue.takings);

export function canPlaceFixture(building: Building & { venue: VenueData }, fixture: Pick<VenueFixture, 'type' | 'x' | 'y' | 'rotation'>, ignoreId?: number): boolean {
  const size = gridSizeOf(building.tier);
  const entrance = entranceCell(building.tier);
  const occupied = new Set(building.venue.fixtures.filter(other => other.id !== ignoreId).flatMap(fixtureTiles).map(tile => `${tile.x}:${tile.y}`));
  return fixtureTiles(fixture).every(tile => tile.x >= 0 && tile.y >= 0 && tile.x < size && tile.y < size && !occupied.has(`${tile.x}:${tile.y}`) && !(tile.x === entrance.x && tile.y === entrance.y));
}

export function placeFixture(state: GameState, buildingId: number, type: ArcadeFixtureId, x: number, y: number, rotation: Rotation): CommandOutcome {
  const building = state.buildings.find(candidate => candidate.id === buildingId);
  if (!building || !isVenue(building)) return { key: 'error.unknownBuilding' };
  if (!(type in ARCADE_FIXTURES)) return { key: 'error.unknownCommand' };
  if (building.tier < ARCADE_FIXTURES[type].minTier) return { key: 'error.tierTooLow' };
  const fixture = { type, x, y, rotation };
  if (!canPlaceFixture(building, fixture)) return { key: 'error.tilesOccupied' };
  const price = ARCADE_FIXTURES[type].price;
  if (state.urbs < price) return { key: 'error.notEnoughUrbs' };
  const placed: VenueFixture = { id: building.venue.nextFixtureId, ...fixture };
  return {
    state: {
      ...state,
      urbs: state.urbs - price,
      buildings: state.buildings.map(candidate => candidate === building ? { ...building, venue: { ...building.venue, fixtures: [...building.venue.fixtures, placed], nextFixtureId: building.venue.nextFixtureId + 1 } } : candidate),
    },
    events: [],
  };
}

export function collectTakings(state: GameState, building: Building & { venue: VenueData }): CommandOutcome {
  const due = takingsDue(building.venue);
  if (due === 0) return { key: 'error.nothingToCollect' };
  return {
    state: {
      ...state,
      urbs: state.urbs + due,
      buildings: state.buildings.map(candidate => candidate === building ? { ...building, venue: { ...building.venue, takings: building.venue.takings - due } } : candidate),
    },
    events: [{ type: 'ItemsCollected', buildingId: building.id }],
  };
}

const withVenue = (state: GameState, building: Building & { venue: VenueData }, venue: VenueData, urbs = state.urbs): GameState => ({
  ...state,
  urbs,
  buildings: state.buildings.map(candidate => candidate === building ? { ...building, venue } : candidate),
});

export const fixtureRefund = (type: ArcadeFixtureId): number => Math.floor(ARCADE_FIXTURES[type].price * VENUE.refundRatio);

export function moveFixture(state: GameState, buildingId: number, fixtureId: number, x: number, y: number, rotation?: Rotation): CommandOutcome {
  const building = state.buildings.find(candidate => candidate.id === buildingId);
  if (!building || !isVenue(building)) return { key: 'error.unknownBuilding' };
  const fixture = building.venue.fixtures.find(candidate => candidate.id === fixtureId);
  if (!fixture) return { key: 'error.unknownFixture' };
  const moved: VenueFixture = { ...fixture, x, y, rotation: rotation ?? fixture.rotation };
  if (!canPlaceFixture(building, moved, fixtureId)) return { key: 'error.tilesOccupied' };
  return { state: withVenue(state, building, { ...building.venue, fixtures: building.venue.fixtures.map(candidate => candidate === fixture ? moved : candidate) }), events: [] };
}

export function removeFixture(state: GameState, buildingId: number, fixtureId: number): CommandOutcome {
  const building = state.buildings.find(candidate => candidate.id === buildingId);
  if (!building || !isVenue(building)) return { key: 'error.unknownBuilding' };
  const fixture = building.venue.fixtures.find(candidate => candidate.id === fixtureId);
  if (!fixture) return { key: 'error.unknownFixture' };
  return { state: withVenue(state, building, { ...building.venue, fixtures: building.venue.fixtures.filter(candidate => candidate !== fixture) }, state.urbs + fixtureRefund(fixture.type)), events: [] };
}

export function setVenuePrice(state: GameState, buildingId: number, price: number): CommandOutcome {
  const building = state.buildings.find(candidate => candidate.id === buildingId);
  if (!building || !isVenue(building)) return { key: 'error.unknownBuilding' };
  if (!Number.isInteger(price) || price < VENUE.minPrice || price > VENUE.maxPrice) return { key: 'error.invalidPrice' };
  return { state: withVenue(state, building, { ...building.venue, price }), events: [] };
}
