import type { VenueData } from '../engine/state';

const HOUR_MS = 3_600_000;

export const EVENT = {
  budgets: [300, 600, 1200] as readonly number[],
  multipliers: [1.5, 2, 2.5] as readonly number[],
  durationMs: 3 * HOUR_MS,
  cooldownMs: 6 * HOUR_MS,
  cancelRefund: 0.5,
  maxDelayHours: 24,
  // Rank a Venue must have reached before it can plan events.
  minRank: 2,
};

const byTier = (values: readonly number[], tier: number): number => values[tier - 1] ?? values[values.length - 1]!;

export const eventBudgetOf = (tier: number): number => byTier(EVENT.budgets, tier);

export const eventMultiplierOf = (tier: number): number => byTier(EVENT.multipliers, tier);

export const isEventActive = (venue: VenueData, at: number): boolean => venue.event !== undefined && venue.event.startsAt <= at && at < venue.event.endsAt;

export const isEventScheduled = (venue: VenueData, at: number): boolean => venue.event !== undefined && at < venue.event.startsAt;

export const eventMultiplier = (venue: VenueData, tier: number, at: number): number => (isEventActive(venue, at) ? eventMultiplierOf(tier) : 1);

export const inCooldown = (venue: VenueData, at: number): boolean => (venue.cooldownUntil ?? 0) > at;

export function eventBoundaries(venue: VenueData, after: number): number[] {
  if (!venue.event) return [];
  return [venue.event.startsAt, venue.event.endsAt].filter(time => time > after);
}
