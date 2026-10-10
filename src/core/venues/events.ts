import venues from '../../../assets/defs/balance/venues.json' with { type: 'json' };
import type { VenueData, VenueType } from '../engine/state';
import { venueTierOf } from './profiles';

const MINUTE_MS = 60_000;

export const EVENT = {
  durationMs: venues.events.durationMinutes * MINUTE_MS,
  cooldownMs: venues.events.cooldownMinutes * MINUTE_MS,
  cancelRefund: venues.events.cancelRefund,
  maxDelayHours: venues.events.maxDelayHours,
  // Rank a Venue must have reached before it can plan events.
  minRank: venues.events.minRank,
};

export const eventBudgetOf = (type: VenueType, tier: number): number => venueTierOf(type, tier).eventBudget!;

export const eventMultiplierOf = (type: VenueType, tier: number): number => venueTierOf(type, tier).eventMultiplier!;

export const isEventActive = (venue: VenueData, at: number): boolean => venue.event !== undefined && venue.event.startsAt <= at && at < venue.event.endsAt;

export const isEventScheduled = (venue: VenueData, at: number): boolean => venue.event !== undefined && at < venue.event.startsAt;

export const eventMultiplier = (venue: VenueData, type: VenueType, tier: number, at: number): number => (isEventActive(venue, at) ? eventMultiplierOf(type, tier) : 1);

export const inCooldown = (venue: VenueData, at: number): boolean => (venue.cooldownUntil ?? 0) > at;

export function eventBoundaries(venue: VenueData, after: number): number[] {
  if (!venue.event) return [];
  return [venue.event.startsAt, venue.event.endsAt].filter(time => time > after);
}
