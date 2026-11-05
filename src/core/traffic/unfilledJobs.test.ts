import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { WALKING } from './walking';
import { congestionStats, createBuilding, jobsOf, newGame, unfilledWorkplaces, type Building } from '../index';

const walkingEnabled = WALKING.enabled;
beforeAll(() => {
  WALKING.enabled = false;
});
afterAll(() => {
  WALKING.enabled = walkingEnabled;
});

const start = newGame({ seed: 'unfilled-jobs', now: 0 });
const homes: Building[] = [{ ...createBuilding(40, 'home', 53, 59, 0), tier: 2 }];
const state = { ...start, adaptationUntil: 0, nextId: 100, buildings: [...start.buildings.map((building) => ({ ...building, tier: 8 })), ...homes] };

describe('unfilledWorkplaces', () => {
  it('lists the workplaces with the most Jobs left, then by id', () => {
    const list = unfilledWorkplaces(state, congestionStats(state));
    expect(list.length).toBeGreaterThan(0);
    for (const { building, offered, filled } of list) {
      expect(offered).toBe(jobsOf(building));
      expect(filled).toBeLessThan(offered);
    }
    const gaps = list.map(({ offered, filled }) => offered - filled);
    expect(gaps).toEqual([...gaps].sort((a, b) => b - a));
  });

  it('is cut at the limit and says nothing about a full workplace', () => {
    expect(unfilledWorkplaces(state, congestionStats(state), 1)).toHaveLength(1);
    const crowded = { ...state, buildings: [...state.buildings, ...Array.from({ length: 6 }, (_, index): Building => ({ ...createBuilding(60 + index, 'home', 53 + index, 59, 0), tier: 8 }))] };
    const stats = congestionStats(crowded);
    for (const { building } of unfilledWorkplaces(crowded, stats, 20)) expect(stats.filledJobs.get(building.id)).toBeLessThan(jobsOf(building));
  });
});
