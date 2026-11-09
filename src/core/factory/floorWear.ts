import floorBalance from '../../../assets/defs/balance/factoryFloor.json' with { type: 'json' };
import { hashSeed } from '../engine/random';
import { VENUE } from '../venues/shared';
import { STAFF } from '../venues/staff';
import { drawBreakdowns, technicianRepairs, wearFixtures } from '../venues/wear';
import { isVenuePowered } from '../venues/venues';
import type { Building, FloorData, GameState } from '../engine/state';
import { floorUsageOf, tierValue } from './factoryFloor';

export { floorUsageOf };

export const minTierOfTechnician = (): number => floorBalance.technicianPosts.findIndex(posts => posts > 0) + 1;

export const technicianPostsOf = (tier: number): number => tierValue(floorBalance.technicianPosts, tier);

const hasFloor = (building: Building): building is Building & { floor: FloorData } => building.type === 'factory' && building.floor !== undefined && building.floor.fixtures.length > 0;

export const technicianWagePerHour = (): number => STAFF.dailyWage.technician / STAFF.dayHours;

// What runs on a Factory floor wears by the hour; at each hour boundary a worn Fixture may break, drawn from the floor's own stream of the Seed, and a Technician
// repairs. A Factory that has no power runs nothing, so nothing wears.
export function advanceFloors(state: GameState, from: number, to: number, supplied?: ReadonlyMap<number, number>): GameState {
  if (to <= from || !state.buildings.some(hasFloor)) return state;
  const hours = (to - from) / VENUE.hourMs;
  const boundary = (to + (state.timeOffset ?? 0)) % VENUE.hourMs === 0;
  let urbs = state.urbs;
  const buildings = state.buildings.map(building => {
    if (!hasFloor(building) || !isVenuePowered(state, building, supplied)) return building;
    const { floor } = building;
    const usage = new Map([...floorUsageOf(floor.fixtures)].map(id => [id, floorBalance.usagePerHour]));
    const hired = floor.technicians ?? 0;
    const wage = Math.min(urbs, hired * technicianWagePerHour() * hours);
    urbs -= wage;
    const technicians = wage > 0 ? hired : 0;
    let fixtures = wearFixtures(floor.fixtures, usage, hours, technicians);
    let rng = floor.rng;
    if (boundary) {
      const drawn = drawBreakdowns(fixtures, rng ?? hashSeed(`${state.seed}:floor:${building.id}`));
      fixtures = drawn.fixtures;
      rng = drawn.rng;
      const repaired = technicianRepairs(fixtures, technicians, urbs);
      fixtures = repaired.fixtures;
      urbs -= repaired.spent;
    }
    return { ...building, floor: { ...floor, fixtures, ...(rng === undefined ? {} : { rng }) } };
  });
  return { ...state, buildings, urbs };
}
