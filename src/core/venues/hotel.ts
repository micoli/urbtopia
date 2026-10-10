import { FIXTURES } from './fixtures';
import { distanceBetween, type LayoutHint } from './layout';
import { clamp01, emptyLayout, type Evaluate, type RoomReport } from './rules';
import { frontRate, hiredOf } from './staff';
import { priceAcceptance } from './shared';
import type { GameState, VenueData, VenueFixture } from '../engine/state';

export const HOTEL = {
  requestsPerHour: 0.35,
  stayHours: 24,
  roomRates: [40, 70, 120] as readonly number[],
  extraGuestRate: 0.25,
  bathReach: 3,
  comfortReach: 3,
  housekeepingPerDay: 10,
  withoutReceptionRate: 0.5,
  priceBase: 0.5,
  priceStep: 0.25,
  reputationStart: 50,
  reputationRate: 0.05,
  usagePerOccupiedRoom: 10,
  standingComfort: [0, 2, 4] as readonly number[],
  attractiveBuildings: ['casino', 'marina', 'theater', 'concertHall', 'communityHall', 'baseballField', 'stadium', 'park'] as readonly string[],
  attractiveCount: 6,
};

export const reputationOf = (venue: VenueData): number => venue.reputation ?? HOTEL.reputationStart;

export function cityAttractiveness(state: GameState): number {
  const count = state.buildings.filter(building => HOTEL.attractiveBuildings.includes(building.type)).length;
  return 0.6 + 0.4 * Math.min(1, count / HOTEL.attractiveCount);
}

export const priceMultiplier = (price: number): number => HOTEL.priceBase + HOTEL.priceStep * price;

export interface Room {
  bed: VenueFixture;
  standing: number;
  valid: boolean;
  rate: number;
}

const standingOf = (comfort: number): number => HOTEL.standingComfort.reduce((standing, threshold, index) => (comfort >= threshold ? index + 1 : standing), 1);

// A room is a bed with a bathroom piece within reach (a piece serves a limited number of rooms); its extras set its standing.
export function roomsOf(venue: VenueData): Room[] {
  const beds = venue.fixtures.filter(fixture => FIXTURES[fixture.type].sleeps !== undefined).sort((a, b) => a.id - b.id);
  const baths = venue.fixtures.filter(fixture => FIXTURES[fixture.type].bath !== undefined);
  const used = new Map<number, number>();
  return beds.map(bed => {
    const bath = baths
      .filter(candidate => distanceBetween(bed, candidate) <= HOTEL.bathReach && (used.get(candidate.id) ?? 0) < FIXTURES[candidate.type].bath!)
      .sort((a, b) => distanceBetween(bed, a) - distanceBetween(bed, b) || a.id - b.id)[0];
    if (bath) used.set(bath.id, (used.get(bath.id) ?? 0) + 1);
    const comfort = venue.fixtures
      .filter(fixture => FIXTURES[fixture.type].comfort !== undefined && distanceBetween(bed, fixture) <= HOTEL.comfortReach)
      .reduce((total, fixture) => total + FIXTURES[fixture.type].comfort!, 0);
    const standing = standingOf(comfort);
    const sleeps = FIXTURES[bed.type].sleeps!;
    return { bed, standing, valid: bath !== undefined, rate: HOTEL.roomRates[standing - 1]! * (1 + HOTEL.extraGuestRate * (sleeps - 1)) };
  });
}

export const evaluateHotel: Evaluate = (state, venue, { working, price, surge }) => {
  const rooms = roomsOf(working);
  const valid = rooms.filter(room => room.valid).sort((a, b) => b.standing - a.standing || a.bed.id - b.bed.id);
  const standing = valid.length ? valid.reduce((total, room) => total + room.standing, 0) / valid.length : 0;
  const reception = working.fixtures.some(fixture => FIXTURES[fixture.type].reception);
  const front = frontRate(venue.venue, 'hotel') * (reception ? 1 : HOTEL.withoutReceptionRate);
  const requests = HOTEL.requestsPerHour * cityAttractiveness(state) * (0.5 + reputationOf(venue.venue) / 100) * surge;
  const accepted = requests * priceAcceptance(price) * front * (valid.length ? 0.8 + 0.2 * standing : 0);
  const demand = accepted * HOTEL.stayHours;
  const occupied = Math.min(valid.length, demand);
  const multiplier = priceMultiplier(price);
  const earnings = new Map<number, number>();
  const usage = new Map<number, number>();
  let left = occupied;
  let gross = 0;
  for (const room of valid) {
    const filled = Math.min(1, left);
    left -= filled;
    const revenue = filled * room.rate * multiplier / HOTEL.stayHours;
    gross += revenue;
    if (filled > 0) {
      earnings.set(room.bed.id, revenue);
      usage.set(room.bed.id, filled * HOTEL.usagePerOccupiedRoom);
    }
  }
  const housekeeping = hiredOf(venue.venue, 'housekeeper') * HOTEL.housekeepingPerDay;
  const cleanliness = occupied > 0 ? Math.min(1, housekeeping / occupied) : 1;
  const broken = venue.venue.fixtures.length - working.fixtures.length;
  const brokenShare = venue.venue.fixtures.length > 0 ? broken / venue.venue.fixtures.length : 0;
  const quality = 0.35 * (standing / 3) + 0.35 * cleanliness + 0.2 * (1 - brokenShare) + 0.1 * (valid.length > 0 ? 1 : 0);
  const report: RoomReport = { rooms: rooms.length, valid: valid.length, occupied, standing, cleanliness };
  const hints = new Map<number, readonly LayoutHint[]>(rooms.filter(room => !room.valid).map(room => [room.bed.id, ['noBath']]));
  return {
    visitors: requests,
    accepted: demand,
    capacity: valid.length,
    served: occupied,
    gross,
    earnings,
    usage,
    layout: { ...emptyLayout(), hints },
    satisfaction: clamp01(valid.length === 0 ? 0 : 0.4 * cleanliness + 0.3 * (standing / 3) + 0.3 * priceAcceptance(price)),
    sales: new Map(),
    rooms: report,
    reputationTarget: 100 * quality,
  };
};

export const stepReputation = (venue: VenueData, target: number): number => {
  const current = reputationOf(venue);
  return Math.min(100, Math.max(0, current + (target - current) * HOTEL.reputationRate));
};
