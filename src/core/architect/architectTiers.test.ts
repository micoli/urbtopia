import { describe, expect, it } from 'vitest';
import { ARCHITECT_BRICKS_BY_TIER, ARCHITECT_DECORS_BY_TIER, ARCHITECT_TIER_COUNT, architectTierOf, gridSideOf, isPlanUnlockedAt, maxFloorsOf, planLimitOf, tierRequiredBy, unlockedBricks, unlockedRoofs } from './architectTiers';
import { activeDecors, addFloor, setAllRoofs, BRICKS, DECORS, DECOR_PRICE, getDecor, toggleDecor, toggleDormer, ROUND_DORMER_PRICE, DORMER_PRICE, isRoundDormer, hasPlinth, planFrom, BRICK_PRICE, getBrick, newPlan, setBrick, exteriorEdges, stats } from './housePlan';
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

  it('lets the first starting model be drawn at Tier 1 and asks the others for a Tier that grows', () => {
    const tiers = (['rect', 'L', 'U', 'T'] as const).map((shape) => tierRequiredBy(newPlan(shape)));
    expect(tiers[0]).toBe(1);
    expect(tiers).toEqual([...tiers].sort());
    expect(tiers.every((tier) => tier <= ARCHITECT_TIER_COUNT)).toBe(true);
  });

  it('unlocks every decor once and prices it', () => {
    expect(ARCHITECT_DECORS_BY_TIER.flat().toSorted()).toEqual([...DECORS].toSorted());
    for (const decor of DECORS) expect(DECOR_PRICE[decor]).toBeGreaterThan(0);
  });

  it('puts a decor on the edges that suit it, replaces it by another and drops it with its brick', () => {
    const plan = newPlan('rect');
    const door = exteriorEdges(plan).find((edge) => edge.floor === 0 && getBrick(plan, edge) === 'door')!;
    const wall = exteriorEdges(plan).find((edge) => edge.floor === 0 && edge.dir === 0)!;
    setBrick(plan, wall, 'wall');
    toggleDecor(plan, wall, 'doorHood');
    expect(getDecor(plan, wall)).toBeUndefined();
    toggleDecor(plan, door, 'doorHood');
    expect(getDecor(plan, door)).toBe('doorHood');
    expect(tierRequiredBy(plan)).toBe(2);
    toggleDecor(plan, door, 'stripedAwning');
    expect(getDecor(plan, door)).toBe('stripedAwning');
    toggleDecor(plan, door, 'stripedAwning');
    expect(getDecor(plan, door)).toBeUndefined();
    toggleDecor(plan, door, 'doorHood');
    setBrick(plan, door, 'wall');
    expect(activeDecors(plan)).toEqual([]);
    toggleDecor(plan, wall, 'pilasters');
    const cost = stats(plan).cost;
    toggleDecor(plan, wall, 'pilasters');
    expect(cost - stats(plan).cost).toBe(DECOR_PRICE.pilasters);
  });

  it('prices a round dormer apart and lets the other tool change the shape of a dormer', () => {
    const plan = newPlan('rect');
    addFloor(plan);
    setAllRoofs(plan, 'mansard');
    expect(ROUND_DORMER_PRICE).toBeGreaterThan(DORMER_PRICE);
    const edge = exteriorEdges(plan).find((candidate) => candidate.floor === plan.floors.length - 1)!;
    const bare = stats(plan).cost;
    toggleDormer(plan, edge);
    expect(stats(plan).cost - bare).toBe(DORMER_PRICE);
    toggleDormer(plan, edge, true);
    expect(isRoundDormer(plan, edge)).toBe(true);
    expect(stats(plan).cost - bare).toBe(ROUND_DORMER_PRICE);
    toggleDormer(plan, edge, true);
    expect(stats(plan).cost).toBe(bare);
  });

  it('keeps the plinth of a plan saved before the option, and drops it when the player does', () => {
    const plan = newPlan('rect');
    const legacy = { ...plan };
    delete legacy.plinth;
    expect(hasPlinth(legacy)).toBe(true);
    expect(hasPlinth({ ...plan, plinth: false })).toBe(false);
    expect(hasPlinth(planFrom({ ...plan, plinth: false }) as typeof plan)).toBe(false);
  });

  it('unlocks every brick once and prices it', () => {
    expect(ARCHITECT_BRICKS_BY_TIER.flat().toSorted()).toEqual([...BRICKS].toSorted());
    for (const brick of BRICKS) expect(BRICK_PRICE[brick]).toBeGreaterThan(0);
  });

  it('keeps the doors of another style on the ground floor and counts them as the door of the house', () => {
    const plan = newPlan('rect');
    addFloor(plan);
    const ground = exteriorEdges(plan).filter((candidate) => candidate.floor === 0 && candidate.dir === 2);
    for (const edge of ground) setBrick(plan, edge, 'doorGarage');
    expect(stats(plan).issues).not.toContain('door');
    const upper = exteriorEdges(plan).find((candidate) => candidate.floor === 1)!;
    const before = getBrick(plan, upper);
    setBrick(plan, upper, 'doorArched');
    expect(getBrick(plan, upper)).toBe(before);
    expect(tierRequiredBy(plan)).toBe(4);
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
  it('refuses a plan whose maps hold a value the studio does not know', () => {
    const plan = newPlan('rect');
    expect(planFrom({ ...plan, bricks: { '0:1:3:2': 'nope' } })).toEqual({ error: 'plan' });
    expect(planFrom({ ...plan, decors: { '0:1:3:2': 'nope' } })).toEqual({ error: 'plan' });
    expect(planFrom({ ...plan, dormers: { '0:1:3:2': 'square' } })).toEqual({ error: 'plan' });
    expect(planFrom({ ...plan, roofStyles: { '1:1:1': { type: 'nope', axis: 'auto', pitch: 'normal', high: 0 } } })).toEqual({ error: 'plan' });
    expect(Number.isFinite(stats(newPlan('rect')).cost)).toBe(true);
  });

  it('asks for the Tier of what is on the plan, not of what was left behind', () => {
    const plan = newPlan('rect');
    plan.bricks['3:9:9:0'] = 'balconyDoor';
    plan.dormers['3:9:9:0'] = true;
    plan.chimneys['9:9'] = true;
    plan.roofStyles['9:9:9'] = { type: 'mansard2', axis: 'auto', pitch: 'normal', high: 0 };
    expect(tierRequiredBy(plan)).toBe(tierRequiredBy(newPlan('rect')));
  });
});
