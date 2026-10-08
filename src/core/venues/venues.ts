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
  takingsCap: 400,
  gridSizes: [6] as readonly number[],
};

export interface FixtureSpec {
  model: string;
  footprint: readonly [number, number];
  price: number;
  playsPerHour: number;
}

export const ARCADE_FIXTURES: Record<ArcadeFixtureId, FixtureSpec> = {
  arcadeMachine: { model: 'mini-arcade/arcade-machine', footprint: [1, 1], price: 150, playsPerHour: 6 },
};

export const ARCADE_FIXTURE_IDS = Object.keys(ARCADE_FIXTURES) as ArcadeFixtureId[];

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

export function takingsPerHour(state: GameState, venue: Building & { venue: VenueData }): number {
  const served = Math.min(visitorsPerHour(state, venue), playsCapacityPerHour(venue.venue));
  return served * VENUE.playPrice;
}

export function advanceVenues(state: GameState, elapsedMs: number): GameState {
  if (elapsedMs <= 0 || !state.buildings.some(isVenue)) return state;
  return {
    ...state,
    buildings: state.buildings.map(building => {
      if (!isVenue(building)) return building;
      const takings = Math.min(VENUE.takingsCap, building.venue.takings + takingsPerHour(state, building) * elapsedMs / VENUE.hourMs);
      return takings === building.venue.takings ? building : { ...building, venue: { ...building.venue, takings } };
    }),
  };
}

export const takingsDue = (venue: VenueData): number => Math.floor(venue.takings);

export function canPlaceFixture(building: Building & { venue: VenueData }, fixture: Pick<VenueFixture, 'type' | 'x' | 'y' | 'rotation'>): boolean {
  const size = gridSizeOf(building.tier);
  const occupied = new Set(building.venue.fixtures.flatMap(fixtureTiles).map(tile => `${tile.x}:${tile.y}`));
  return fixtureTiles(fixture).every(tile => tile.x >= 0 && tile.y >= 0 && tile.x < size && tile.y < size && !occupied.has(`${tile.x}:${tile.y}`));
}

export function placeFixture(state: GameState, buildingId: number, type: ArcadeFixtureId, x: number, y: number, rotation: Rotation): CommandOutcome {
  const building = state.buildings.find(candidate => candidate.id === buildingId);
  if (!building || !isVenue(building)) return { key: 'error.unknownBuilding' };
  if (!(type in ARCADE_FIXTURES)) return { key: 'error.unknownCommand' };
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
