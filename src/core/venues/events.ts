import type { VenueData, VenueType } from '../engine/state';
import { venueTierOf } from './profiles';

const HOUR_MS = 3_600_000;

export const EVENT = {
  durationMs: 3 * HOUR_MS,
  cooldownMs: 6 * HOUR_MS,
  cancelRefund: 0.5,
  maxDelayHours: 24,
  // Rank a Venue must have reached before it can plan events.
  minRank: 2,
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
