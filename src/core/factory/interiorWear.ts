import interiorBalance from '../../../assets/defs/balance/factoryInterior.json' with { type: 'json' };
import packhouseBalance from '../../../assets/defs/balance/packhouseInterior.json' with { type: 'json' };
import { hashSeed } from '../engine/random';
import { VENUE } from '../venues/shared';
import { STAFF } from '../venues/staff';
import { drawBreakdowns, technicianRepairs, wearFixtures } from '../venues/wear';
import { isVenuePowered } from '../venues/venues';
import type { Building, BuildingType, InteriorData, GameState } from '../engine/state';
import { hasProductionInteriorType, interiorProfileOf } from '../interiors/interiorProfile';
import { maxTierOf } from '../economy/tiers';
import { interiorUsageOf, interiorUsageWeightsOf } from './interiorLinks';
import { valueByTier } from '../interiors/valueByTier';

export { interiorUsageOf };

export const minTierOfTechnician = (type: BuildingType = 'factory'): number => {
  for (let tier = 1; tier <= maxTierOf(type); tier++) if (technicianPostsOf(tier, type) > 0) return tier;
  return 0;
};

export const technicianPostsOf = (tier: number, type: BuildingType = 'factory'): number => interiorProfileOf(type)?.technicianPosts(tier) ?? 0;

const hasInterior = (building: Building): building is Building & { interior: InteriorData } => hasProductionInteriorType(building.type) && building.interior !== undefined;

export const restockerPostsOf = (tier: number, type: BuildingType = 'packhouse'): number => valueByTier(type === 'factory' ? interiorBalance.restockerPosts : packhouseBalance.restockerPosts, tier);

export const restockerWagePerHour = (): number => STAFF.dailyWage.restocker / STAFF.dayHours;

export const technicianWagePerHour = (): number => STAFF.dailyWage.technician / STAFF.dayHours;

// What runs on a Factory interior wears by the hour; at each hour boundary a worn Fixture may break, drawn from the floor's own stream of the Seed, and a Technician
// repairs. A Factory that has no power runs nothing, so nothing wears.
export function advanceInteriors(state: GameState, from: number, to: number, supplied?: ReadonlyMap<number, number>): GameState {
  if (to <= from || !state.buildings.some(hasInterior)) return state;
  const hours = (to - from) / VENUE.hourMs;
  const boundary = (to + (state.timeOffset ?? 0)) % VENUE.hourMs === 0;
  let urbs = state.urbs;
  const buildings = state.buildings.map(building => {
    if (!hasInterior(building)) return building;
    const { interior } = building;
    const owed = Math.min(urbs, (interior.restockers ?? 0) * restockerWagePerHour() * hours);
    urbs -= owed;
    const hired = interior.technicians ?? 0;
    const due = hired * technicianWagePerHour() * hours;
    const wage = Math.min(urbs, due);
    urbs -= wage;
    if (building.breakerOff || interior.fixtures.length === 0 || !isVenuePowered(state, building, supplied)) return building;
    const usage = new Map([...interiorUsageWeightsOf(interior.fixtures)].map(([id, weight]) => [id, interiorBalance.usagePerHour * weight]));
    const technicians = hired > 0 && wage >= due ? hired : 0;
    let fixtures = wearFixtures(interior.fixtures, usage, hours, technicians);
    let rng = interior.rng;
    if (boundary) {
      const drawn = drawBreakdowns(fixtures, rng ?? hashSeed(`${state.seed}:interior:${building.id}`));
      fixtures = drawn.fixtures;
      rng = drawn.rng;
      const repaired = technicianRepairs(fixtures, technicians, urbs);
      fixtures = repaired.fixtures;
      urbs -= repaired.spent;
    }
    return { ...building, interior: { ...interior, fixtures, ...(rng === undefined ? {} : { rng }) } };
  });
  return { ...state, buildings, urbs };
}
