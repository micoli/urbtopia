import { describe, expect, it } from 'vitest';
import { ARCHITECT_TIER_COUNT, architectTierOf, gridSideOf, isPlanUnlockedAt, maxFloorsOf, planLimitOf, tierRequiredBy, unlockedBricks, unlockedRoofs } from './architectTiers';
import { addFloor, newPlan, setBrick, exteriorEdges } from './housePlan';
import { newGame } from '../index';
import { handleCommand } from '../engine/commands';

describe('the Tiers of the Architect office', () => {
  it('keeps what an earlier Tier unlocked', () => {
    for (let tier = 2; tier <= ARCHITECT_TIER_COUNT; tier++) {
      expect(unlockedBricks(tier)).toEqual(expect.arrayContaining([...unlockedBricks(tier - 1)]));
      expect(unlockedRoofs(tier)).toEqual(expect.arrayContaining([...unlockedRoofs(tier - 1)]));
      expect(maxFloorsOf(tier)).toBeGreaterThanOrEqual(maxFloorsOf(tier - 1));
      expect(gridSideOf(tier)).toBeGreaterThanOrEqual(gridSideOf(tier - 1));
      expect(planLimitOf(tier)).toBeGreaterThan(planLimitOf(tier - 1));
    }
  });

  it('lets every starting shape be drawn at Tier 1', () => {
    for (const shape of ['rect', 'L', 'U', 'T'] as const) expect(isPlanUnlockedAt(newPlan(shape), 1)).toBe(true);
  });

  it('asks for the Tier of the most advanced asset of a plan', () => {
    const plan = newPlan('rect');
    const edge = exteriorEdges(plan).find((candidate) => candidate.floor === 0 && candidate.dir === 0)!;
    setBrick(plan, edge, 'balcony');
    expect(tierRequiredBy(plan)).toBe(3);
    expect(isPlanUnlockedAt(plan, 2)).toBe(false);
    expect(isPlanUnlockedAt(plan, 3)).toBe(true);
  });

  it('asks for a higher Tier for more floors', () => {
    const plan = newPlan('rect');
    while (plan.floors.length < 3) addFloor(plan);
    expect(tierRequiredBy(plan)).toBe(2);
  });

  it('is 0 without an office, and the city then builds and saves at Tier 1', () => {
    const state = newGame({ seed: 'tiers', now: 0 });
    expect(architectTierOf(state)).toBe(0);
    expect(handleCommand(state, { type: 'SaveHousePlan', name: 'A', plan: newPlan('rect') }, 0)).toHaveProperty('state');
  });

  it('refuses a plan that uses what the office has not unlocked, and plans beyond the limit', () => {
    const state = newGame({ seed: 'tiers', now: 0 });
    const locked = newPlan('rect');
    while (locked.floors.length < 3) addFloor(locked);
    expect(handleCommand(state, { type: 'SaveHousePlan', name: 'Tall', plan: locked }, 0)).toEqual({ key: 'error.housePlanLocked' });
    let current = state;
    for (let index = 0; index < planLimitOf(1); index++) {
      const saved = handleCommand(current, { type: 'SaveHousePlan', name: `Plan ${index}`, plan: newPlan('rect') }, 0);
      if ('key' in saved) throw new Error(saved.key);
      current = saved.state;
    }
    expect(handleCommand(current, { type: 'SaveHousePlan', name: 'One more', plan: newPlan('rect') }, 0)).toEqual({ key: 'error.housePlanLimit' });
  });

  it('asks for a Tier for the colours of the swatches it unlocks', () => {
    const plan = newPlan('rect');
    plan.wallColor = '#8f5a43';
    expect(tierRequiredBy(plan)).toBe(4);
    plan.wallColor = '#123456';
    expect(tierRequiredBy(plan)).toBe(ARCHITECT_TIER_COUNT);
  });
});
