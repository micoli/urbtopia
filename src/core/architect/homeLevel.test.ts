import { describe, expect, it } from 'vitest';
import { CELLS_PER_HOME_LEVEL, homeLevelOf, homeLevelOfCells } from './homeLevel';
import { addFloor, newPlan } from './housePlan';
import { housePlanTypeOf } from './houseDesign';
import { createBuilding } from '../index';

describe('the level of a Home', () => {
  it('is the Tier of a Home that is not a house of a plan', () => {
    expect(homeLevelOf({ ...createBuilding(1, 'home', 0, 0, 0), tier: 3 })).toBe(3);
  });

  it('follows the cells of the floors of a house of a plan', () => {
    const plan = newPlan('rect');
    const one = { ...createBuilding(1, housePlanTypeOf(plan) as never, 0, 0, 0), design: { name: 'A', plan } };
    const cells = plan.floors.flat(2).filter(Boolean).length;
    expect(homeLevelOf(one)).toBe(homeLevelOfCells(cells));
    const taller = structuredClone(plan);
    addFloor(taller);
    expect(homeLevelOf({ ...one, design: { name: 'A', plan: taller } })).toBeGreaterThanOrEqual(homeLevelOf(one));
  });

  it('holds at least one level and one level per block of cells', () => {
    expect(homeLevelOfCells(1)).toBe(1);
    expect(homeLevelOfCells(CELLS_PER_HOME_LEVEL + 1)).toBe(2);
  });
});
