import { describe, expect, it } from 'vitest';
import { ROAD_TIER_COSTS, citizensOf, congestionStats, createBuilding, dispatch, laneCapacity, newGame, tileKey, type Building, type GameState } from '../index';

const base = newGame({ seed: 'traffic', now: 0 });

function withHome(state: GameState, x: number, y: number, tier: number, rotation: 0 | 1 | 2 | 3 = 0): GameState {
  const home: Building = { ...createBuilding(state.nextId, 'home', x, y, rotation), tier };
  return { ...state, nextId: state.nextId + 1, buildings: [...state.buildings, home] };
}

function homeIdOf(state: GameState): number {
  return state.buildings.filter((building) => building.type === 'home').at(-1)!.id;
}

describe('congestionStats', () => {
  it('loads the shared road with the Commuters of a Home', () => {
    const state = withHome(base, 56, 59, 1);
    const stats = congestionStats(state);
    const home = stats.homes.get(homeIdOf(state))!;
    expect(home.disconnected).toBe(false);
    expect(home.commuters).toBe(citizensOf(1));
    expect(stats.commuters).toBe(citizensOf(1));
    expect(stats.sections.get(tileKey({ x: 56, y: 58 }))!.load).toBeCloseTo(citizensOf(1));
  });

  it('spreads Commuters evenly over reachable workplaces', () => {
    const state = withHome(base, 56, 59, 1);
    const stats = congestionStats(state);
    const share = citizensOf(1) / 2;
    expect(stats.sections.get(tileKey({ x: 55, y: 58 }))!.load).toBeCloseTo(share);
    expect(stats.sections.get(tileKey({ x: 60, y: 58 }))!.load).toBeCloseTo(share);
  });

  it('takes the worst section of the Commute as its bottleneck', () => {
    const state = withHome(base, 56, 59, 2);
    const stats = congestionStats(state);
    const worst = Math.max(...[...stats.sections.values()].map((section) => section.ratio));
    expect(stats.homes.get(homeIdOf(state))!.ratio).toBeCloseTo(Math.min(2, worst));
    expect(stats.index).toBeCloseTo(stats.homes.get(homeIdOf(state))!.ratio);
  });

  it('lowers the ratio when roads gain Lanes', () => {
    const state = withHome(base, 56, 59, 2);
    const upgraded = { ...state, roads: state.roads.map((road) => ({ ...road, tier: 3 })) };
    const before = congestionStats(state).homes.get(homeIdOf(state))!.ratio;
    const after = congestionStats(upgraded).homes.get(homeIdOf(state))!.ratio;
    expect(after).toBeLessThan(before);
    expect(congestionStats(upgraded).sections.get(tileKey({ x: 56, y: 58 }))!.capacity).toBe(laneCapacity(3));
  });

  it('flags a Home with no road as disconnected at maximum Congestion', () => {
    const state = withHome(base, 20, 20, 1);
    const home = congestionStats(state).homes.get(homeIdOf(state))!;
    expect(home.disconnected).toBe(true);
    expect(home.ratio).toBe(2);
  });

  it('flags a road section that serves a Home but no workplace', () => {
    const isolated = [{ x: 20, y: 22, kind: 'road' as const }, { x: 21, y: 22, kind: 'road' as const }];
    const state = withHome({ ...base, roads: [...base.roads, ...isolated] }, 20, 23, 1);
    const stats = congestionStats(state);
    expect(stats.homes.get(homeIdOf(state))!.disconnected).toBe(true);
    expect(stats.disconnectedSections.map((tiles) => tiles.map(tileKey).sort())).toContainEqual(['20,22', '21,22']);
  });

  it('flags a road section that serves workplaces but no Home, once the city has Homes', () => {
    expect(congestionStats(base).disconnectedSections).toEqual([]);
    const isolated = [{ x: 20, y: 22, kind: 'road' as const }];
    const state = withHome({ ...base, roads: [...base.roads, ...isolated] }, 20, 23, 1);
    expect(congestionStats(state).disconnectedSections.map((tiles) => tiles.length).sort()).toEqual([1, 10]);
  });

  it('does not flag the connected road network', () => {
    const stats = congestionStats(withHome(base, 56, 59, 1));
    expect(stats.disconnectedSections).toEqual([]);
  });
});

describe('city without a Commute', () => {
  it('has no congestion when there is no road or no workplace', () => {
    const noRoad = withHome({ ...base, roads: [], roundabouts: [] }, 56, 59, 1);
    const noWorkplace = withHome({ ...base, buildings: [] }, 56, 59, 1);
    for (const state of [noRoad, noWorkplace]) {
      const home = congestionStats(state).homes.get(homeIdOf(state))!;
      expect(home).toEqual({ commuters: 0, ratio: 0, disconnected: false });
    }
  });
});

describe('UpgradeRoads', () => {
  const tile = { x: 55, y: 58 };

  it('adds a Lane and charges the tier price', () => {
    const result = dispatch(base, { type: 'UpgradeRoads', tiles: [tile] }, 0);
    if (!result.ok) throw new Error(result.error.key);
    expect(result.state.roads.find((road) => road.x === tile.x && road.y === tile.y)!.tier).toBe(2);
    expect(result.state.urbs).toBe(base.urbs - ROAD_TIER_COSTS[1]!);
  });

  it('skips tiles already at the maximum tier and charges only the others', () => {
    const mixed = { ...base, roads: base.roads.map((road) => (road.x === 55 ? { ...road, tier: 3 } : road)) };
    const result = dispatch(mixed, { type: 'UpgradeRoads', tiles: [{ x: 55, y: 58 }, { x: 56, y: 58 }] }, 0);
    if (!result.ok) throw new Error(result.error.key);
    expect(result.state.urbs).toBe(mixed.urbs - ROAD_TIER_COSTS[1]!);
  });

  it('refuses beyond the maximum tier, without road or without Urbs', () => {
    const maxed = { ...base, roads: base.roads.map((road) => ({ ...road, tier: 3 })) };
    expect(dispatch(maxed, { type: 'UpgradeRoads', tiles: [tile] }, 0)).toMatchObject({ ok: false, error: { key: 'error.maxRoadTier' } });
    expect(dispatch(base, { type: 'UpgradeRoads', tiles: [{ x: 1, y: 1 }] }, 0)).toMatchObject({ ok: false, error: { key: 'error.noRoadHere' } });
    expect(dispatch({ ...base, urbs: 0 }, { type: 'UpgradeRoads', tiles: [tile] }, 0)).toMatchObject({ ok: false, error: { key: 'error.notEnoughUrbs' } });
  });
});
