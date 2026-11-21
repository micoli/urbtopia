import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { ARCHITECT_TIER_COUNT, isPlanUnlockedAt, tierRequiredBy, ARCHITECT_BRICKS_BY_TIER, ARCHITECT_DECORS_BY_TIER, ARCHITECT_ROOFS_BY_TIER } from './architectTiers';
import { BRICKS, BRICK_DEFINITIONS, DECORS, DECOR_DEFINITIONS, DOOR_BRICKS, GRID, ROOFS, SHAPES, WINDOW_BRICKS, newPlan, shapeMask, stats } from './housePlan';

const glbOf = (file: string) => `assets/managed-models/architect/${file}/${file}.glb`;

describe('the definitions of the Architect office', () => {
  it('gives every brick but the bare wall a GLB that exists', () => {
    for (const brick of BRICKS) {
      const { file } = BRICK_DEFINITIONS[brick];
      if (brick === 'wall') expect(file).toBeUndefined();
      else expect(existsSync(glbOf(file!)), `${brick}: ${file}`).toBe(true);
    }
  });

  it('gives every decor a GLB that exists', () => {
    for (const decor of DECORS) expect(existsSync(glbOf(DECOR_DEFINITIONS[decor].file)), decor).toBe(true);
  });

  it('keeps the wall, the windows and the doors apart', () => {
    expect(WINDOW_BRICKS.length).toBeGreaterThan(0);
    expect(DOOR_BRICKS.length).toBeGreaterThan(0);
    expect(WINDOW_BRICKS.filter((brick) => DOOR_BRICKS.includes(brick))).toEqual([]);
    expect(BRICK_DEFINITIONS.wall.kind).toBe('wall');
  });

  it('unlocks every brick, decor and roof at a Tier of the office', () => {
    for (const byTier of [ARCHITECT_BRICKS_BY_TIER, ARCHITECT_DECORS_BY_TIER, ARCHITECT_ROOFS_BY_TIER]) expect(byTier).toHaveLength(ARCHITECT_TIER_COUNT);
    expect(ARCHITECT_BRICKS_BY_TIER.flat().toSorted()).toEqual([...BRICKS].toSorted());
    expect(ARCHITECT_DECORS_BY_TIER.flat().toSorted()).toEqual([...DECORS].toSorted());
    expect(ARCHITECT_ROOFS_BY_TIER.flat().toSorted()).toEqual([...ROOFS].toSorted());
  });

  it('draws every starting shape on the grid of the studio', () => {
    for (const shape of SHAPES) {
      const mask = shapeMask(shape);
      expect(mask).toHaveLength(GRID);
      expect(mask.every((row) => row.length === GRID)).toBe(true);
      expect(mask.flat().some(Boolean)).toBe(true);
    }
  });

  it('opens every starting model as a complete house the office of its Tier can build', () => {
    for (const shape of SHAPES) {
      const plan = newPlan(shape);
      expect(isPlanUnlockedAt(plan, tierRequiredBy(plan)), shape).toBe(true);
      expect(Object.keys(plan.decors ?? {}).length > 0 || shape === SHAPES[0], shape).toBe(true);
      expect(stats(plan).issues, shape).toEqual([]);
      expect(plan.floors.length, shape).toBeGreaterThanOrEqual(2);
    }
  });
});
