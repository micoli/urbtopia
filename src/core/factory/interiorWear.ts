import interiorBalance from '../../../assets/defs/balance/factoryInterior.json' with { type: 'json' };
import packhouseBalance from '../../../assets/defs/balance/packhouseInterior.json' with { type: 'json' };
import { hashSeed } from '../engine/random';
import { VENUE } from '../venues/shared';
import { isProductionInteriorKind } from '../venues/venueVocabulary';
import { STAFF } from '../venues/staff';
import { drawBreakdowns, technicianRepairs, wearFixtures } from '../venues/wear';
import { isVenuePowered } from '../venues/venues';
import type { Building, BuildingType, InteriorData, GameState } from '../engine/state';
import { interiorLayoutOf } from '../interiors/interiorStaff';
import { interiorUsageOf, interiorUsageWeightsOf, tierValue } from './factoryInterior';

export { interiorUsageOf };

const technicianPostsTable = (type: BuildingType): readonly number[] => interiorLayoutOf(type)?.technicianPosts ?? interiorBalance.technicianPosts;

export const minTierOfTechnician = (type: BuildingType = 'factory'): number => technicianPostsTable(type).findIndex(posts => posts > 0) + 1;

export const technicianPostsOf = (tier: number, type: BuildingType = 'factory'): number => tierValue(technicianPostsTable(type), tier);

const hasInterior = (building: Building): building is Building & { interior: InteriorData } => isProductionInteriorKind(building.type) && building.interior !== undefined && building.interior.fixtures.length > 0;

export const restockerPostsOf = (tier: number): number => tierValue(packhouseBalance.restockerPosts, tier);

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
    if (!hasInterior(building) || !isVenuePowered(state, building, supplied)) return building;
    const { interior } = building;
    const usage = new Map([...interiorUsageWeightsOf(interior.fixtures)].map(([id, weight]) => [id, interiorBalance.usagePerHour * weight]));
    const owed = Math.min(urbs, (interior.restockers ?? 0) * restockerWagePerHour() * hours);
    urbs -= owed;
    const hired = interior.technicians ?? 0;
    const due = hired * technicianWagePerHour() * hours;
    const wage = Math.min(urbs, due);
    urbs -= wage;
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
