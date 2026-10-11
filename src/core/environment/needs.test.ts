import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { WALKING } from '../traffic/walking';
import { NEED_LEVELS, createBuilding, needsPyramid, newGame, type GameState } from '../index';

const walkingEnabled = WALKING.enabled;
beforeAll(() => {
  WALKING.enabled = false;
});
afterAll(() => {
  WALKING.enabled = walkingEnabled;
});

const NOW = 1_700_000_000_000;
const empty: GameState = { ...newGame({ seed: 'needs', now: NOW }), buildings: [], adaptationUntil: 0 };

function withBuildings(...types: Parameters<typeof createBuilding>[1][]): GameState {
  const buildings = types.map((type, index) => ({ ...createBuilding(index + 1, type, 55 + index * 4, 57, 0) }));
  return { ...empty, nextId: buildings.length + 1, buildings };
}

function factor(state: GameState, id: string) {
  return needsPyramid(state).levels.flatMap(level => level.factors).find(entry => entry.id === id)!;
}

describe('needs pyramid', () => {
  it('has the five Need levels from the base up', () => {
    expect(needsPyramid(empty).levels.map(level => level.id)).toEqual([...NEED_LEVELS]);
  });

  it('has no satisfaction and no bottleneck in a city without Citizens', () => {
    const pyramid = needsPyramid(empty);
    expect(pyramid.bottleneck).toBeNull();
    expect(pyramid.levels.every(level => level.satisfaction === null && !level.fragile)).toBe(true);
  });

  it('leaves factors without data out of the level average', () => {
    const state = withBuildings('home');
    expect(factor(state, 'food').satisfaction).toBeNull();
    expect(factor(state, 'shops').satisfaction).toBeNull();
    const esteem = needsPyramid(state).levels.find(level => level.id === 'esteem')!;
    const modelled = esteem.factors.filter(entry => entry.satisfaction !== null);
    expect(esteem.satisfaction).toBeCloseTo(modelled.reduce((sum, entry) => sum + entry.satisfaction!, 0) / modelled.length);
  });

  it('shows a missing Service category as unsatisfied, and a facility as served', () => {
    const without = withBuildings('home');
    expect(factor(without, 'education').satisfaction).toBe(0);
    const served = withBuildings('home', 'school');
    expect(factor(served, 'education').satisfaction).toBe(100);
  });

  it('feeds the Fulfilment level with Worship coverage', () => {
    expect(factor(withBuildings('home'), 'worship')).toMatchObject({ level: 'fulfilment', satisfaction: 0 });
    expect(factor(withBuildings('home', 'catholicChurch'), 'worship').satisfaction).toBe(100);
  });

  it('reports the weakest factor as the bottleneck', () => {
    const state = withBuildings('home');
    const pyramid = needsPyramid(state);
    const modelled = pyramid.levels.flatMap(level => level.factors).filter(entry => entry.satisfaction !== null);
    const lowest = Math.min(...modelled.map(entry => entry.satisfaction!));
    expect(pyramid.bottleneck?.satisfaction).toBe(lowest);
  });

  it('lowers the climate factor as emissions warm the city', () => {
    const cool = withBuildings('home');
    const warm = { ...withBuildings('home', 'factory', 'factory', 'factory', 'factory'), adaptationUntil: NOW + 3_600_000 };
    expect(factor(warm, 'climate').satisfaction).toBeLessThan(factor(cool, 'climate').satisfaction!);
  });

  it('marks the levels above an unsatisfied level as fragile', () => {
    const levels = needsPyramid(withBuildings('home')).levels;
    const firstWeak = levels.findIndex(level => level.satisfaction !== null && level.satisfaction < 50);
    expect(firstWeak).toBeGreaterThanOrEqual(0);
    expect(levels[firstWeak]!.fragile).toBe(firstWeak > 0 && levels.slice(0, firstWeak).some(level => (level.satisfaction ?? 100) < 50));
    expect(levels.slice(firstWeak + 1).every(level => level.fragile)).toBe(true);
  });
});
