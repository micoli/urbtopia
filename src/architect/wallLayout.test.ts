import { describe, expect, it } from 'vitest';
import { newPlan } from '../core/architect/housePlan.ts';
import { PLINTH_PUSH, WALL_INSET, cellReach, endShift, wallEnds } from './wallLayout.ts';

describe('the ends of a wall', () => {
  it('turn a convex corner where the plan has no neighbour, and go straight along a wall', () => {
    const plan = newPlan('rect');
    expect(wallEnds(plan, { floor: 0, c: 1, r: 3, dir: 2 })).toEqual({ left: 'convex', right: 'straight' });
    expect(wallEnds(plan, { floor: 0, c: 2, r: 3, dir: 2 })).toEqual({ left: 'straight', right: 'straight' });
    expect(wallEnds(plan, { floor: 0, c: 4, r: 3, dir: 2 })).toEqual({ left: 'straight', right: 'convex' });
  });

  it('turn a concave corner where the front of the neighbour is built too', () => {
    const plan = newPlan('L');
    expect(wallEnds(plan, { floor: 0, c: 3, r: 2, dir: 1 })).toEqual({ left: 'concave', right: 'straight' });
  });

  it('are reached sooner at a convex corner and later at a concave one, because the walls stand back', () => {
    expect(endShift('convex')).toBe(WALL_INSET);
    expect(endShift('concave')).toBe(-WALL_INSET);
    expect(endShift('straight')).toBe(0);
  });
});

describe('the reach of a cell', () => {
  it('stops at the wall on a free side, further out by the push, and covers the cell against a neighbour', () => {
    const plan = newPlan('rect');
    expect(cellReach(plan, 0, 2, 2)).toEqual({ north: 0.5, south: 0.5, east: 0.5, west: 0.5 });
    expect(cellReach(plan, 0, 1, 1)).toEqual({ north: 0.5 - WALL_INSET, west: 0.5 - WALL_INSET, east: 0.5, south: 0.5 });
    expect(cellReach(plan, 0, 4, 3, PLINTH_PUSH).south).toBeCloseTo(0.5 - WALL_INSET + PLINTH_PUSH);
  });
});
