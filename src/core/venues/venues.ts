import { ARCADE_FIXTURES } from './fixtures';
import { LAYOUT, layoutOf, type Layout } from './layout';
import { EVENT, eventBoundaries, eventBudgetOf, eventMultiplier, inCooldown, isEventActive } from './events';
import { drawBreakdowns, isBroken, repairCost, restored, technicianRepairs, wearFixtures } from './wear';
import { hashSeed } from '../engine/random';
import { STAFF_ROLES, employeeRate, hiredOf, managerYield, postsOf, securityRate, wagesPerHour } from './staff';
import { citizensOf } from '../buildings/city';
import { centerOf, economicPower } from '../environment/ecology';
import { isAdapting } from '../environment/adaptation';
import { energyStats } from '../environment/energy';
import { isWithinReach } from '../services/facilities';
import type { CommandOutcome } from '../engine/commands';
import type { ArcadeFixtureId, Building, GameState, Rotation, StaffRole, VenueData, VenueFixture } from '../engine/state';

export const VENUE = {
  hourMs: 3_600_000,
  reachRadius: 12,
  visitorsPerCitizenPerHour: 0.2,
  playPrice: 2,
  minPrice: 1,
  maxPrice: 6,
  priceTolerance: 0.2,
  takingsCaps: [400, 900, 1800] as readonly number[],
  gridSizes: [6, 8, 10] as readonly number[],
  upgradeCosts: { 2: 2500, 3: 6000 } as Record<number, number>,
  refundRatio: 0.5,
};

export { ARCADE_FIXTURES, ARCADE_FIXTURE_IDS, type FixtureSpec } from './fixtures';
export type { Layout, LayoutHint } from './layout';
export { EVENT, eventBudgetOf, eventMultiplierOf, isEventActive, isEventScheduled, inCooldown, eventBoundaries } from './events';
export { WEAR, conditionOf, isBroken, repairCost, technicianRepairCost } from './wear';
export { STAFF, STAFF_ROLES, hiredOf, postsOf, totalStaff, wagesPerHour } from './staff';

// The entrance stays on the same cell of the north wall at every Tier, so growing the grid never moves it under a Fixture.
export const entranceCell = (_tier = 1): { x: number; y: number } => ({ x: 3, y: 0 });

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

export const priceOf = (venue: VenueData): number => (hiredOf(venue, 'manager') > 0 ? venue.price ?? VENUE.playPrice : VENUE.playPrice);

export function visitorsPerHour(state: GameState, venue: Building): number {
  const to = centerOf(venue);
  const citizens = state.buildings.reduce((total, home) => {
    if (home.type !== 'home') return total;
    const from = centerOf(home);
    return isWithinReach(from.x - to.x, from.y - to.y, VENUE.reachRadius) ? total + citizensOf(home.tier) : total;
  }, 0);
  return citizens * VENUE.visitorsPerCitizenPerHour;
}

export const venueLayout = (building: Building & { venue: VenueData }): Layout => layoutOf(building.venue, entranceCell(building.tier));

const playsOf = (fixture: VenueFixture, layout: Layout): number =>
  ARCADE_FIXTURES[fixture.type].playsPerHour + (layout.seatedIds.has(fixture.id) ? LAYOUT.playsPerSeat : 0);

export function playsCapacityPerHour(venue: VenueData, layout?: Layout): number {
  return venue.fixtures.reduce((total, fixture) => total + (layout ? playsOf(fixture, layout) : ARCADE_FIXTURES[fixture.type].playsPerHour), 0);
}

export const priceAcceptance = (price: number): number => Math.min(1, Math.max(0, 1 - VENUE.priceTolerance * (price - VENUE.playPrice)));

export interface VenuePerformance {
  visitors: number;
  accepted: number;
  capacity: number;
  served: number;
  grossPerHour: number;
  wagesPerHour: number;
  closed: boolean;
  powered: boolean;
  earningsPerHour: number;
  earningsByFixture: ReadonlyMap<number, number>;
  playsByFixture: ReadonlyMap<number, number>;
  layout: Layout;
}

const POWER_EPSILON = 1e-9;

export function isVenuePowered(state: GameState, venue: Building, supplied?: ReadonlyMap<number, number>): boolean {
  if (isAdapting(state)) return true;
  return ((supplied ?? energyStats(state).supplied).get(venue.id) ?? 0) >= economicPower(venue) - POWER_EPSILON;
}

export function venuePerformance(state: GameState, venue: Building & { venue: VenueData }, powered = isVenuePowered(state, venue), at = state.lastSeen): VenuePerformance {
  const price = priceOf(venue.venue);
  const working: VenueData = { ...venue.venue, fixtures: venue.venue.fixtures.filter(fixture => !isBroken(fixture)) };
  const layout = layoutOf(working, entranceCell(venue.tier));
  const visitors = visitorsPerHour(state, venue);
  const accepted = visitors * priceAcceptance(price) * layout.attractiveness * securityRate(venue.venue) * eventMultiplier(venue.venue, venue.tier, at);
  const raw = playsCapacityPerHour(working, layout);
  const capacity = raw * layout.counterRate * employeeRate(venue.venue);
  const served = Math.min(accepted, capacity);
  const yieldRate = managerYield(venue.venue);
  const grossPerHour = served * price * yieldRate;
  const wages = wagesPerHour(venue.venue);
  const closed = venue.venue.takings <= 0 && grossPerHour < wages;
  const operating = powered && !closed;
  const earningsByFixture = new Map<number, number>();
  const playsByFixture = new Map<number, number>();
  if (capacity > 0 && operating) {
    for (const fixture of working.fixtures) {
      const share = playsOf(fixture, layout) / raw;
      if (share === 0) continue;
      playsByFixture.set(fixture.id, served * share);
      earningsByFixture.set(fixture.id, served * share * price * yieldRate);
    }
  }
  return { visitors, accepted, capacity, served, grossPerHour, wagesPerHour: wages, closed, powered, earningsPerHour: operating ? grossPerHour : 0, earningsByFixture, playsByFixture, layout };
}

export const takingsPerHour = (state: GameState, venue: Building & { venue: VenueData }): number => venuePerformance(state, venue).earningsPerHour;

export const netPerHour = (performance: VenuePerformance): number => performance.closed || !performance.powered ? 0 : performance.grossPerHour - performance.wagesPerHour;

const isHourBoundary = (state: GameState, time: number): boolean => (time + (state.timeOffset ?? 0)) % VENUE.hourMs === 0;

function advanceVenue(state: GameState, building: Building & { venue: VenueData }, from: number, to: number, supplied?: ReadonlyMap<number, number>): Building {
  const performance = venuePerformance(state, building, isVenuePowered(state, building, supplied), from);
  if (performance.closed || !performance.powered) return building;
  const hours = (to - from) / VENUE.hourMs;
  const technicians = hiredOf(building.venue, 'technician');
  const net = (performance.grossPerHour - performance.wagesPerHour) * hours;
  let takings = Math.max(0, Math.min(takingsCapOf(building.tier), building.venue.takings + net));
  let fixtures = wearFixtures(building.venue.fixtures, performance.playsByFixture, hours, technicians);
  let rng = building.venue.rng;
  if (isHourBoundary(state, to)) {
    const drawn = drawBreakdowns(fixtures, rng ?? hashSeed(`${state.seed}:venue:${building.id}`));
    fixtures = drawn.fixtures;
    rng = drawn.rng;
    const repaired = technicianRepairs(fixtures, technicians, takings);
    fixtures = repaired.fixtures;
    takings -= repaired.spent;
  }
  const next: VenueData = { ...building.venue, fixtures, takings, ...(rng === undefined ? {} : { rng }) };
  if (next.event && next.event.endsAt <= to) {
    next.cooldownUntil = next.event.endsAt + EVENT.cooldownMs;
    delete next.event;
  }
  return { ...building, venue: next };
}

export function advanceVenues(state: GameState, from: number, to: number, supplied?: ReadonlyMap<number, number>): GameState {
  if (to <= from || !state.buildings.some(isVenue)) return state;
  const delivered = supplied ?? energyStats(state, from).supplied;
  return { ...state, buildings: state.buildings.map(building => (isVenue(building) ? advanceVenue(state, building, from, to, delivered) : building)) };
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
  if (hiredOf(building.venue, 'manager') === 0) return { key: 'error.managerRequired' };
  if (!Number.isInteger(price) || price < VENUE.minPrice || price > VENUE.maxPrice) return { key: 'error.invalidPrice' };
  return { state: withVenue(state, building, { ...building.venue, price }), events: [] };
}

export function hireStaff(state: GameState, buildingId: number, role: StaffRole): CommandOutcome {
  const building = state.buildings.find(candidate => candidate.id === buildingId);
  if (!building || !isVenue(building)) return { key: 'error.unknownBuilding' };
  if (!STAFF_ROLES.includes(role)) return { key: 'error.unknownCommand' };
  const hired = hiredOf(building.venue, role);
  if (hired >= postsOf(role, building.tier)) return { key: 'error.noStaffPost' };
  return { state: withVenue(state, building, { ...building.venue, staff: { ...building.venue.staff, [role]: hired + 1 } }), events: [] };
}

export function releaseStaff(state: GameState, buildingId: number, role: StaffRole): CommandOutcome {
  const building = state.buildings.find(candidate => candidate.id === buildingId);
  if (!building || !isVenue(building)) return { key: 'error.unknownBuilding' };
  if (!STAFF_ROLES.includes(role)) return { key: 'error.unknownCommand' };
  const hired = hiredOf(building.venue, role);
  if (hired === 0) return { key: 'error.noStaffToRelease' };
  return { state: withVenue(state, building, { ...building.venue, staff: { ...building.venue.staff, [role]: hired - 1 } }), events: [] };
}

export function repairFixture(state: GameState, buildingId: number, fixtureId: number): CommandOutcome {
  const building = state.buildings.find(candidate => candidate.id === buildingId);
  if (!building || !isVenue(building)) return { key: 'error.unknownBuilding' };
  const fixture = building.venue.fixtures.find(candidate => candidate.id === fixtureId);
  if (!fixture) return { key: 'error.unknownFixture' };
  const cost = repairCost(fixture);
  if (cost === 0) return { key: 'error.nothingToRepair' };
  if (state.urbs < cost) return { key: 'error.notEnoughUrbs' };
  return { state: withVenue(state, building, { ...building.venue, fixtures: building.venue.fixtures.map(candidate => candidate === fixture ? restored(fixture) : candidate) }, state.urbs - cost), events: [] };
}

export function scheduleEvent(state: GameState, buildingId: number, startsInHours: number): CommandOutcome {
  const building = state.buildings.find(candidate => candidate.id === buildingId);
  if (!building || !isVenue(building)) return { key: 'error.unknownBuilding' };
  if (hiredOf(building.venue, 'manager') === 0) return { key: 'error.managerRequired' };
  if (!Number.isInteger(startsInHours) || startsInHours < 0 || startsInHours > EVENT.maxDelayHours) return { key: 'error.invalidEventStart' };
  if (building.venue.event) return { key: 'error.eventBusy' };
  if (inCooldown(building.venue, state.lastSeen)) return { key: 'error.eventCooldown' };
  const budget = eventBudgetOf(building.tier);
  if (state.urbs < budget) return { key: 'error.notEnoughUrbs' };
  const startsAt = state.lastSeen + startsInHours * VENUE.hourMs;
  return { state: withVenue(state, building, { ...building.venue, event: { startsAt, endsAt: startsAt + EVENT.durationMs, budget } }, state.urbs - budget), events: [] };
}

export function cancelEvent(state: GameState, buildingId: number): CommandOutcome {
  const building = state.buildings.find(candidate => candidate.id === buildingId);
  if (!building || !isVenue(building)) return { key: 'error.unknownBuilding' };
  const event = building.venue.event;
  if (!event) return { key: 'error.noEvent' };
  if (isEventActive(building.venue, state.lastSeen)) return { key: 'error.eventStarted' };
  const venue: VenueData = { ...building.venue };
  delete venue.event;
  return { state: withVenue(state, building, venue, state.urbs + Math.floor(event.budget * EVENT.cancelRefund)), events: [] };
}

export const venueEventBoundaries = (state: GameState, after: number): number[] =>
  state.buildings.flatMap(building => (isVenue(building) ? eventBoundaries(building.venue, after) : []));
