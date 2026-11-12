import { FIXTURES } from '../venues/fixtures';
import { congestionStats } from '../traffic/congestion';
import { jobsOf } from '../traffic/jobs';
import { isAdapting } from '../environment/adaptation';
import type { Building, BuildingType, GameState, VenueFixture } from '../engine/state';
import { interiorFillRateFrom, interiorPartPresence, serviceLayoutOf, type InteriorPart } from './interiorStaff';
import interiorBalance from '../../../assets/defs/balance/factoryInterior.json' with { type: 'json' };

// The size of the room of a Service interior by Tier, and the most quality its furniture can add.
export const serviceGridSizeOf = (type: BuildingType, tier: number): number => {
  const sizes = serviceLayoutOf(type)?.gridSizes ?? [5];
  return sizes[Math.min(tier, sizes.length) - 1]!;
};

const capOf = (type: BuildingType, tier: number): number => {
  const caps = serviceLayoutOf(type)?.qualityCaps ?? [0];
  return caps[Math.min(tier, caps.length) - 1]!;
};

// A bonus counts in full up to a share of the cap of the Tier, then grows with every piece but less and less, and never reaches the cap.
function saturate(total: number, cap: number): number {
  const knee = cap * interiorBalance.bonusKnee;
  return total <= knee ? total : cap - (cap - knee) * Math.exp(-(total - knee) / (cap - knee));
}

// The quality the furniture of a Service interior adds, from nothing to the cap of its Tier, before any Staff comes to work.
export function serviceFurnitureQuality(building: Pick<Building, 'type' | 'tier' | 'interior'>): number {
  const fixtures: readonly VenueFixture[] = building.interior?.fixtures ?? [];
  const total = fixtures.reduce((sum, fixture) => sum + (FIXTURES[fixture.type].quality ?? 0), 0);
  return total === 0 ? 0 : saturate(total, capOf(building.type, building.tier));
}

const qualities = new WeakMap<GameState, Map<string, number>>();

// What the Staff of a Service interior deliver of its quality, for a part of the effect: the furniture, times the share of the part that the hired Staff cover, times the share of the
// Jobs that Citizens fill. Nothing without furniture or without the role hired.
//
// The Knowledge of a Home feeds the Commute that the Fill rate reads, so what depends on Knowledge counts the hired Staff as if they all came to work (`withFill` false).
export function serviceQualityOf(state: GameState, building: Building, part: InteriorPart, withFill = true): number {
  if (!building.interior) return 0;
  const cache = qualities.get(state) ?? new Map<string, number>();
  qualities.set(state, cache);
  const key = `${building.id}:${part}:${withFill}`;
  const cached = cache.get(key);
  if (cached !== undefined) return cached;
  const furniture = serviceFurnitureQuality(building);
  const presence = furniture === 0 ? 0 : interiorPartPresence(building, part);
  const fill = presence === 0 || !withFill ? 1 : interiorFillRateFrom(building, isAdapting(state) ? undefined : congestionStats(state).filledJobs, jobsOf(building));
  const quality = furniture * presence * fill;
  cache.set(key, quality);
  return quality;
}
