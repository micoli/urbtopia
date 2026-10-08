import { FIXTURES } from './fixtures';
import { evaluateArcade } from './arcade';
import { evaluateHotel, stepReputation } from './hotel';
import { evaluateSupermarket, nextStockOut, restockShelf, sellStock, stockerRestocks } from './supermarket';
import { VENUE_PROFILES, isVenueType, venuePower } from './profiles';
import type { Layout } from './layout';
import { entranceCell, gridSizeOf, takingsCapOf, VENUE as SHARED } from './shared';
import { EVENT, eventBoundaries, eventBudgetOf, eventMultiplier, inCooldown, isEventActive } from './events';
import { drawBreakdowns, isBroken, repairCost, restored, technicianRepairs, wearFixtures } from './wear';
import { hashSeed } from '../engine/random';
import { hiredOf, managerYield, postsOf, staffRolesOf, wagesPerHour } from './staff';
import { isAdapting } from '../environment/adaptation';
import { energyStats } from '../environment/energy';
import { isGood, type GoodId } from '../economy/items';
import type { Evaluation, RuleContext } from './rules';
import type { CommandOutcome } from '../engine/commands';
import type { Building, FixtureId, GameState, Rotation, StaffRole, VenueData, VenueFixture, VenueType } from '../engine/state';

export const VENUE = { ...SHARED, upgradeCosts: VENUE_PROFILES.arcade.upgradeCosts };

export { FIXTURES, FIXTURE_IDS, FIXTURE_MODELS, fixtureIdsOf, type FixtureSpec } from './fixtures';
export { VENUE_TYPES, VENUE_PROFILES, isVenueType, venuePower } from './profiles';
export { entranceCell, gridSizeOf, priceAcceptance, takingsCapOf } from './shared';
export { playsCapacityPerHour } from './arcade';
export { HOTEL, cityAttractiveness, priceMultiplier, reputationOf, roomsOf } from './hotel';
export { SUPERMARKET, markupOf, unitPrice, stockOf, isShelf, hasStock, restockFee } from './supermarket';
export type { Layout, LayoutHint } from './layout';
export type { RoomReport } from './rules';
export { EVENT, eventBudgetOf, eventMultiplierOf, isEventActive, isEventScheduled, inCooldown, eventBoundaries } from './events';
export { WEAR, conditionOf, isBroken, repairCost, technicianRepairCost } from './wear';
export { STAFF, STAFF_ROLES, FRONT_ROLE, hiredOf, postsOf, staffRolesOf, totalStaff, wagesPerHour } from './staff';

export const isVenue = (building: Building): building is Building & { venue: VenueData } => building.venue !== undefined && isVenueType(building.type);

export const venueTypeOf = (building: Building): VenueType => building.type as VenueType;

export function fixtureFootprint(type: FixtureId, rotation: Rotation): { width: number; depth: number } {
  const [width, depth] = FIXTURES[type].footprint;
  return rotation % 2 === 0 ? { width, depth } : { width: depth, depth: width };
}

export function fixtureTiles(fixture: Pick<VenueFixture, 'type' | 'x' | 'y' | 'rotation'>): { x: number; y: number }[] {
  const { width, depth } = fixtureFootprint(fixture.type, fixture.rotation);
  return Array.from({ length: width * depth }, (_, index) => ({ x: fixture.x + (index % width), y: fixture.y + Math.floor(index / width) }));
}

export const priceOf = (venue: VenueData): number => (hiredOf(venue, 'manager') > 0 ? venue.price ?? VENUE.playPrice : VENUE.playPrice);

export const venueLayout = (state: GameState, building: Building & { venue: VenueData }): Layout => venuePerformance(state, building, true).layout;

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
  usageByFixture: ReadonlyMap<number, number>;
  salesByFixture: ReadonlyMap<number, number>;
  layout: Layout;
  rooms?: Evaluation['rooms'];
  reputationTarget?: number;
}

const evaluators = { arcade: evaluateArcade, supermarket: evaluateSupermarket, hotel: evaluateHotel };

const POWER_EPSILON = 1e-9;

export function isVenuePowered(state: GameState, venue: Building, supplied?: ReadonlyMap<number, number>): boolean {
  if (isAdapting(state)) return true;
  return ((supplied ?? energyStats(state).supplied).get(venue.id) ?? 0) >= venuePower(venue) - POWER_EPSILON;
}

export function venuePerformance(state: GameState, venue: Building & { venue: VenueData }, powered = isVenuePowered(state, venue), at = state.lastSeen): VenuePerformance {
  const price = priceOf(venue.venue);
  const working: VenueData = { ...venue.venue, fixtures: venue.venue.fixtures.filter(fixture => !isBroken(fixture)) };
  const context: RuleContext = { working, price, surge: eventMultiplier(venue.venue, venue.tier, at) };
  const evaluation = evaluators[venueTypeOf(venue)](state, venue, context);
  const yieldRate = managerYield(venue.venue);
  const grossPerHour = evaluation.gross * yieldRate;
  const wages = wagesPerHour(venue.venue);
  const closed = venue.venue.takings <= 0 && grossPerHour < wages;
  const operating = powered && !closed;
  const earningsByFixture = new Map<number, number>();
  const usageByFixture = new Map<number, number>();
  const salesByFixture = new Map<number, number>();
  if (operating) {
    for (const [id, value] of evaluation.earnings) earningsByFixture.set(id, value * yieldRate);
    for (const [id, value] of evaluation.usage) usageByFixture.set(id, value);
    for (const [id, value] of evaluation.sales) salesByFixture.set(id, value);
  }
  return {
    visitors: evaluation.visitors,
    accepted: evaluation.accepted,
    capacity: evaluation.capacity,
    served: evaluation.served,
    grossPerHour,
    wagesPerHour: wages,
    closed,
    powered,
    earningsPerHour: operating ? grossPerHour : 0,
    earningsByFixture,
    usageByFixture,
    salesByFixture,
    layout: evaluation.layout,
    ...(evaluation.rooms ? { rooms: evaluation.rooms } : {}),
    ...(evaluation.reputationTarget === undefined ? {} : { reputationTarget: evaluation.reputationTarget }),
  };
}

export const visitorsPerHour = (state: GameState, venue: Building & { venue: VenueData }): number => venuePerformance(state, venue, true).visitors;

export const takingsPerHour = (state: GameState, venue: Building & { venue: VenueData }): number => venuePerformance(state, venue).earningsPerHour;

export const netPerHour = (performance: VenuePerformance): number => performance.closed || !performance.powered ? 0 : performance.grossPerHour - performance.wagesPerHour;

const isHourBoundary = (state: GameState, time: number): boolean => (time + (state.timeOffset ?? 0)) % VENUE.hourMs === 0;

interface Advanced {
  building: Building;
  goods: GameState['storage']['goods'];
}

function advanceVenue(state: GameState, building: Building & { venue: VenueData }, from: number, to: number, goods: GameState['storage']['goods'], supplied?: ReadonlyMap<number, number>): Advanced {
  const type = venueTypeOf(building);
  const performance = venuePerformance(state, building, isVenuePowered(state, building, supplied), from);
  const boundary = isHourBoundary(state, to);
  if (performance.closed || !performance.powered) {
    if (type !== 'hotel' || !boundary) return { building, goods };
    return { building: { ...building, venue: { ...building.venue, reputation: stepReputation(building.venue, 0) } }, goods };
  }
  const hours = (to - from) / VENUE.hourMs;
  const technicians = hiredOf(building.venue, 'technician');
  const net = (performance.grossPerHour - performance.wagesPerHour) * hours;
  let takings = Math.max(0, Math.min(takingsCapOf(building.tier), building.venue.takings + net));
  let fixtures = wearFixtures(building.venue.fixtures, performance.usageByFixture, hours, technicians);
  if (type === 'supermarket') fixtures = sellStock(fixtures, performance.salesByFixture, hours);
  let rng = building.venue.rng;
  let stored = goods;
  let reputation = building.venue.reputation;
  if (boundary) {
    const drawn = drawBreakdowns(fixtures, rng ?? hashSeed(`${state.seed}:venue:${building.id}`));
    fixtures = drawn.fixtures;
    rng = drawn.rng;
    const repaired = technicianRepairs(fixtures, technicians, takings);
    fixtures = repaired.fixtures;
    takings -= repaired.spent;
    if (type === 'supermarket') {
      const restocked = stockerRestocks(fixtures, hiredOf(building.venue, 'stocker'), stored, takings);
      fixtures = restocked.fixtures;
      stored = restocked.goods;
      takings -= restocked.fee;
    }
    if (type === 'hotel') reputation = stepReputation(building.venue, performance.reputationTarget ?? 0);
  }
  const next: VenueData = { ...building.venue, fixtures, takings, ...(rng === undefined ? {} : { rng }), ...(reputation === undefined ? {} : { reputation }) };
  if (next.event && next.event.endsAt <= to) {
    next.cooldownUntil = next.event.endsAt + EVENT.cooldownMs;
    delete next.event;
  }
  return { building: { ...building, venue: next }, goods: stored };
}

export function advanceVenues(state: GameState, from: number, to: number, supplied?: ReadonlyMap<number, number>): GameState {
  if (to <= from || !state.buildings.some(isVenue)) return state;
  const delivered = supplied ?? energyStats(state, from).supplied;
  let goods = state.storage.goods;
  const buildings = state.buildings.map(building => {
    if (!isVenue(building)) return building;
    const advanced = advanceVenue(state, building, from, to, goods, delivered);
    goods = advanced.goods;
    return advanced.building;
  });
  return { ...state, buildings, ...(goods === state.storage.goods ? {} : { storage: { ...state.storage, goods } }) };
}

// Times after `after` at which a Venue changes the way it works: the start and the end of an event, a shelf running out.
export function venueBoundaries(state: GameState, after: number, supplied?: ReadonlyMap<number, number>): number[] {
  const venues = state.buildings.filter(isVenue);
  if (venues.length === 0) return [];
  const delivered = supplied ?? energyStats(state, after).supplied;
  return venues.flatMap(building => {
    const events = eventBoundaries(building.venue, after);
    if (venueTypeOf(building) !== 'supermarket') return events;
    const performance = venuePerformance(state, building, isVenuePowered(state, building, delivered), after);
    return [...events, ...nextStockOut(building.venue.fixtures, performance.salesByFixture, after, VENUE.hourMs)];
  });
}

export const takingsDue = (venue: VenueData): number => Math.floor(venue.takings);

export function canPlaceFixture(building: Building & { venue: VenueData }, fixture: Pick<VenueFixture, 'type' | 'x' | 'y' | 'rotation'>, ignoreId?: number): boolean {
  const size = gridSizeOf(building.tier);
  const entrance = entranceCell(building.tier);
  const occupied = new Set(building.venue.fixtures.filter(other => other.id !== ignoreId).flatMap(fixtureTiles).map(tile => `${tile.x}:${tile.y}`));
  return fixtureTiles(fixture).every(tile => tile.x >= 0 && tile.y >= 0 && tile.x < size && tile.y < size && !occupied.has(`${tile.x}:${tile.y}`) && !(tile.x === entrance.x && tile.y === entrance.y));
}

const venueOf = (state: GameState, buildingId: number): (Building & { venue: VenueData }) | undefined => {
  const building = state.buildings.find(candidate => candidate.id === buildingId);
  return building && isVenue(building) ? building : undefined;
};

export function placeFixture(state: GameState, buildingId: number, type: FixtureId, x: number, y: number, rotation: Rotation): CommandOutcome {
  const building = venueOf(state, buildingId);
  if (!building) return { key: 'error.unknownBuilding' };
  if (!(type in FIXTURES) || FIXTURES[type].venue !== venueTypeOf(building)) return { key: 'error.unknownCommand' };
  if (building.tier < FIXTURES[type].minTier) return { key: 'error.tierTooLow' };
  const fixture = { type, x, y, rotation };
  if (!canPlaceFixture(building, fixture)) return { key: 'error.tilesOccupied' };
  const price = FIXTURES[type].price;
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

export const fixtureRefund = (type: FixtureId): number => Math.floor(FIXTURES[type].price * VENUE.refundRatio);

export function moveFixture(state: GameState, buildingId: number, fixtureId: number, x: number, y: number, rotation?: Rotation): CommandOutcome {
  const building = venueOf(state, buildingId);
  if (!building) return { key: 'error.unknownBuilding' };
  const fixture = building.venue.fixtures.find(candidate => candidate.id === fixtureId);
  if (!fixture) return { key: 'error.unknownFixture' };
  const moved: VenueFixture = { ...fixture, x, y, rotation: rotation ?? fixture.rotation };
  if (!canPlaceFixture(building, moved, fixtureId)) return { key: 'error.tilesOccupied' };
  return { state: withVenue(state, building, { ...building.venue, fixtures: building.venue.fixtures.map(candidate => candidate === fixture ? moved : candidate) }), events: [] };
}

export function removeFixture(state: GameState, buildingId: number, fixtureId: number): CommandOutcome {
  const building = venueOf(state, buildingId);
  if (!building) return { key: 'error.unknownBuilding' };
  const fixture = building.venue.fixtures.find(candidate => candidate.id === fixtureId);
  if (!fixture) return { key: 'error.unknownFixture' };
  return { state: withVenue(state, building, { ...building.venue, fixtures: building.venue.fixtures.filter(candidate => candidate !== fixture) }, state.urbs + fixtureRefund(fixture.type)), events: [] };
}

export function setVenuePrice(state: GameState, buildingId: number, price: number): CommandOutcome {
  const building = venueOf(state, buildingId);
  if (!building) return { key: 'error.unknownBuilding' };
  if (hiredOf(building.venue, 'manager') === 0) return { key: 'error.managerRequired' };
  if (!Number.isInteger(price) || price < VENUE.minPrice || price > VENUE.maxPrice) return { key: 'error.invalidPrice' };
  return { state: withVenue(state, building, { ...building.venue, price }), events: [] };
}

export function hireStaff(state: GameState, buildingId: number, role: StaffRole): CommandOutcome {
  const building = venueOf(state, buildingId);
  if (!building) return { key: 'error.unknownBuilding' };
  if (!staffRolesOf(venueTypeOf(building)).includes(role)) return { key: 'error.unknownCommand' };
  const hired = hiredOf(building.venue, role);
  if (hired >= postsOf(role, building.tier)) return { key: 'error.noStaffPost' };
  return { state: withVenue(state, building, { ...building.venue, staff: { ...building.venue.staff, [role]: hired + 1 } }), events: [] };
}

export function releaseStaff(state: GameState, buildingId: number, role: StaffRole): CommandOutcome {
  const building = venueOf(state, buildingId);
  if (!building) return { key: 'error.unknownBuilding' };
  if (!staffRolesOf(venueTypeOf(building)).includes(role)) return { key: 'error.unknownCommand' };
  const hired = hiredOf(building.venue, role);
  if (hired === 0) return { key: 'error.noStaffToRelease' };
  return { state: withVenue(state, building, { ...building.venue, staff: { ...building.venue.staff, [role]: hired - 1 } }), events: [] };
}

export function repairFixture(state: GameState, buildingId: number, fixtureId: number): CommandOutcome {
  const building = venueOf(state, buildingId);
  if (!building) return { key: 'error.unknownBuilding' };
  const fixture = building.venue.fixtures.find(candidate => candidate.id === fixtureId);
  if (!fixture) return { key: 'error.unknownFixture' };
  const cost = repairCost(fixture);
  if (cost === 0) return { key: 'error.nothingToRepair' };
  if (state.urbs < cost) return { key: 'error.notEnoughUrbs' };
  return { state: withVenue(state, building, { ...building.venue, fixtures: building.venue.fixtures.map(candidate => candidate === fixture ? restored(fixture) : candidate) }, state.urbs - cost), events: [] };
}

export function stockShelf(state: GameState, buildingId: number, fixtureId: number, good: GoodId): CommandOutcome {
  const building = venueOf(state, buildingId);
  if (!building || venueTypeOf(building) !== 'supermarket') return { key: 'error.unknownBuilding' };
  const shelf = building.venue.fixtures.find(candidate => candidate.id === fixtureId);
  if (!shelf || FIXTURES[shelf.type].shelf === undefined) return { key: 'error.unknownFixture' };
  if (!isGood(good)) return { key: 'error.unknownCommand' };
  if (shelf.good !== undefined && shelf.good !== good && (shelf.stock ?? 0) >= 1) return { key: 'error.shelfBusy' };
  if (Math.floor(state.storage.goods[good] ?? 0) < 1) return { key: 'error.missingGoods' };
  const result = restockShelf(building.venue.fixtures, state.storage.goods, fixtureId, good, state.urbs);
  if (!result) return { key: FIXTURES[shelf.type].shelf! <= Math.floor(shelf.good === good ? shelf.stock ?? 0 : 0) ? 'error.shelfFull' : 'error.notEnoughUrbs' };
  return {
    state: { ...withVenue(state, building, { ...building.venue, fixtures: result.fixtures }, state.urbs - result.fee), storage: { ...state.storage, goods: result.goods } },
    events: [],
  };
}

export function scheduleEvent(state: GameState, buildingId: number, startsInHours: number): CommandOutcome {
  const building = venueOf(state, buildingId);
  if (!building) return { key: 'error.unknownBuilding' };
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
  const building = venueOf(state, buildingId);
  if (!building) return { key: 'error.unknownBuilding' };
  const event = building.venue.event;
  if (!event) return { key: 'error.noEvent' };
  if (isEventActive(building.venue, state.lastSeen)) return { key: 'error.eventStarted' };
  const venue: VenueData = { ...building.venue };
  delete venue.event;
  return { state: withVenue(state, building, venue, state.urbs + Math.floor(event.budget * EVENT.cancelRefund)), events: [] };
}
