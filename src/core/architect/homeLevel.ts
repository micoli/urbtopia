import type { Building } from '../engine/state';
import { isHousePlanType } from './houseDesign';
import { CELLS_PER_HOME_LEVEL, homeLevelOfCells } from './housingCapacity';

export { CELLS_PER_HOME_LEVEL, homeLevelOfCells };

// The level of a Home in the tables of Citizens and Demand: its Tier, except for a house of a plan, whose level follows the cells of its floors.
export function homeLevelOf(building: Pick<Building, 'type' | 'tier' | 'design'>): number {
  if (!building.design || !isHousePlanType(building.type)) return building.tier;
  return homeLevelOfCells(building.design.plan.floors.flat(2).filter(Boolean).length);
}
