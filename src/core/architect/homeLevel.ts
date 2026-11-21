import { HOME_TIERS } from '../economy/economy';
import type { Building } from '../engine/state';
import { isHousePlanType } from './houseDesign';

// The habitable cells that one level of a Home holds: a Brownstone, 1×2 tiles of 4×4 cells, has 32 cells per floor and one level per floor.
export const CELLS_PER_HOME_LEVEL = 32;

export const homeLevelOfCells = (cells: number): number => Math.min(HOME_TIERS.length, Math.max(1, Math.ceil(cells / CELLS_PER_HOME_LEVEL)));

// The level of a Home in the tables of Citizens and Demand: its Tier, except for a house of a plan, whose level follows the cells of its floors.
export function homeLevelOf(building: Pick<Building, 'type' | 'tier' | 'design'>): number {
  if (!building.design || !isHousePlanType(building.type)) return building.tier;
  return homeLevelOfCells(building.design.plan.floors.flat(2).filter(Boolean).length);
}
