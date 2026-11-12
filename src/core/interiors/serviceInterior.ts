import { FIXTURES } from '../venues/fixtures';
import { congestionStats } from '../traffic/congestion';
import { jobsOf } from '../traffic/jobs';
import { isAdapting } from '../environment/adaptation';
import type { Building, BuildingType, GameState, VenueFixture } from '../engine/state';
import { careBalanceOf, interiorFillRateFrom, interiorPartPresence, serviceLayoutOf, type InteriorPart } from './interiorStaff';
import interiorBalance from '../../../assets/defs/balance/factoryInterior.json' with { type: 'json' };

// The size of the room of a Service interior by Tier, and the most quality its furniture can add.
export const serviceGridSizeOf = (type: BuildingType, tier: number): number => {
  const sizes = serviceLayoutOf(type)?.gridSizes ?? [5];
  return sizes[Math.min(tier, sizes.length) - 1]!;
};

export const serviceQualityCapOf = (type: BuildingType, tier: number): number => capOf(type, tier);

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
// The Knowledge of a Home feeds the Commute that the Fill rate reads, so what depends on Knowledge counts the hired Staff as if they all came to work (`jobs` null); what a caller already
// reads the Jobs filled from passes them, and by default they are read from the Commute of the city.
export function serviceQualityOf(state: GameState, building: Building, part: InteriorPart, jobs?: ReadonlyMap<number, number> | null): number {
  if (!building.interior) return 0;
  const cache = qualities.get(state) ?? new Map<string, number>();
  qualities.set(state, cache);
  const key = `${building.id}:${part}:${jobs === undefined ? 'city' : jobs === null ? 'full' : 'given'}`;
  const cached = jobs instanceof Map ? undefined : cache.get(key);
  if (cached !== undefined) return cached;
  const furniture = serviceFurnitureQuality(building);
  const presence = furniture === 0 ? 0 : interiorPartPresence(building, part);
  const filled = jobs === undefined ? (isAdapting(state) ? undefined : congestionStats(state).filledJobs) : jobs ?? undefined;
  const fill = presence === 0 ? 1 : interiorFillRateFrom(building, isAdapting(state) ? undefined : filled, jobsOf(building));
  const quality = furniture * presence * fill;
  if (!(jobs instanceof Map)) cache.set(key, quality);
  return quality;
}

// The Well-being points that a Hospital adds to the Homes it serves: the care its furniture makes possible, delivered by its nurses, its doctors and its surgeons, each for their weight.
export function careWellbeingOf(state: GameState, hospital: Building, jobs: ReadonlyMap<number, number> | null): number {
  const care = careBalanceOf(hospital.type);
  if (!care || !hospital.interior) return 0;
  const { carePrimary, careDoctor, careSurgeon } = care.weights;
  return care.points * (carePrimary * serviceQualityOf(state, hospital, 'carePrimary', jobs) + careDoctor * serviceQualityOf(state, hospital, 'careDoctor', jobs) + careSurgeon * serviceQualityOf(state, hospital, 'careSurgeon', jobs));
}
