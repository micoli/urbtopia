import { afterEach, describe, expect, it } from 'vitest';
import { citizensOf, congestionStats, createBuilding, newGame, tileKey, type Building, type GameState } from '../index';
import { WALKING, modeShares } from './walking';

const base = newGame({ seed: 'walking', now: 0 });
const defaultThreshold = WALKING.workThreshold;

function withHome(state: GameState, x: number, y: number, tier: number): GameState {
  const home: Building = { ...createBuilding(state.nextId, 'home', x, y, 0), tier };
  return { ...state, roads: [...state.roads], nextId: state.nextId + 1, buildings: [...state.buildings, home] };
}

function homeIdOf(state: GameState): number {
  return state.buildings.filter((building) => building.type === 'home').at(-1)!.id;
}

afterEach(() => {
  WALKING.workThreshold = defaultThreshold;
});

describe('walking commute', () => {
  it('lets Commuters walk to a workplace within the threshold and keeps them off the road', () => {
    const state = withHome(base, 56, 59, 1);
    const stats = congestionStats(state);
    const home = stats.homes.get(homeIdOf(state))!;
    expect(home.walkers).toBe(citizensOf(1));
    expect(home.commuters).toBe(0);
    expect(stats.walkers).toBe(citizensOf(1));
    expect(stats.commuters).toBe(0);
    expect(stats.sections.has(tileKey({ x: 55, y: 58 }))).toBe(false);
    expect(stats.index).toBe(0);
  });

  it('drives when the walking path is longer than the threshold', () => {
    WALKING.workThreshold = 3;
    const state = withHome(base, 56, 59, 1);
    const home = congestionStats(state).homes.get(homeIdOf(state))!;
    expect(home.walkers).toBe(0);
    expect(home.commuters).toBe(citizensOf(1));
  });

  it('walks across a Crossing when it shortens the path', () => {
    WALKING.workThreshold = 5;
    const state = withHome(base, 56, 59, 1);
    expect(congestionStats(state).homes.get(homeIdOf(state))!.walkers).toBe(0);
    const crossed = { ...state, roads: state.roads.map((road) => (road.x === 56 && road.y === 58 ? { ...road, kind: 'crossing' as const } : road)) };
    expect(congestionStats(crossed).homes.get(homeIdOf(crossed))!.walkers).toBe(citizensOf(1));
  });

  it('splits one Home between walkers and drivers by workplace distance', () => {
    WALKING.workThreshold = 7;
    const state = withHome(base, 56, 59, 3);
    const home = congestionStats(state).homes.get(homeIdOf(state))!;
    expect(home.walkers).toBeGreaterThan(0);
    expect(home.commuters).toBeGreaterThan(0);
    expect(home.walkers + home.commuters + home.unemployed).toBe(citizensOf(3));
  });

  it('counts every Citizen in exactly one mode', () => {
    const state = withHome(base, 56, 59, 3);
    const stats = congestionStats(state);
    expect(stats.modes.car + stats.modes.walking + stats.modes.transit + stats.unemployed).toBe(citizensOf(3));
    const shares = modeShares(stats);
    expect(shares.car + shares.transit + shares.walking).toBeCloseTo(1);
  });

  it('has no walkers when there is nothing to commute to', () => {
    const state = withHome({ ...base, buildings: [] }, 56, 59, 1);
    const stats = congestionStats(state);
    expect(stats.walkers).toBe(0);
    expect(modeShares(stats)).toEqual({ car: 0, transit: 0, walking: 0 });
  });

  it('is deterministic', () => {
    const state = withHome(base, 56, 59, 3);
    expect(congestionStats({ ...state }).homes).toEqual(congestionStats(state).homes);
  });
});
