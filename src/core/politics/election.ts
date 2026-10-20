import { nextRandom } from '../engine/random';
import { FACTION_IDS, type FactionId } from './factions';
import type { PoliticsState } from './politics';
import { POLITICS } from './politicsBalance';

export interface ElectionResult {
  // The game day of the Election.
  day: number;
  // The Approval the Mayor went to the polls with.
  approval: number;
  // How favourable the next Council is, between -1 and 1.
  mandate: number;
  // The seats of the next Council.
  seats: Record<FactionId, number>;
}

const NEUTRAL_APPROVAL = 50;

// The most seats an Election moves from one Faction to another.
const MAX_SEATS_MOVED = 2;

export const mandateOf = (approval: number): number => (approval - NEUTRAL_APPROVAL) / NEUTRAL_APPROVAL;

export function termDaysLeft(politics: PoliticsState, day: number): number {
  return Math.max(0, politics.term.startDay + POLITICS.term.days - day);
}

// A Mayor liked by the city faces a balanced Council; the less liked, the more seats an Election moves from one Faction to another. The next Term votes with the mandate the Approval gave.
export function holdElection(politics: PoliticsState, approval: number, day: number): PoliticsState {
  const moved = Math.round(Math.max(0, -mandateOf(approval)) * MAX_SEATS_MOVED);
  let rngState = politics.rngState;
  const draw = (count: number): number => {
    const next = nextRandom(rngState);
    rngState = next.rngState;
    return Math.floor(next.value * count);
  };
  const seats = { ...politics.seats };
  const givers = FACTION_IDS.filter(faction => seats[faction] > 1);
  if (moved > 0 && givers.length > 0) {
    const from = givers[draw(givers.length)]!;
    const takers = FACTION_IDS.filter(faction => faction !== from);
    const to = takers[draw(takers.length)]!;
    const count = Math.min(moved, seats[from] - 1);
    seats[from] -= count;
    seats[to] += count;
  }
  const mandate = mandateOf(approval);
  return { ...politics, rngState, seats, mandate, term: { startDay: day, number: politics.term.number + 1 }, lastElection: { day, approval, mandate, seats } };
}
