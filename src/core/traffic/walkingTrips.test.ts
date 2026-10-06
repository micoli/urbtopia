import { afterEach, describe, expect, it } from 'vitest';
import { citizensOf, congestionStats, createBuilding, newGame, type Building, type BuildingType, type GameState } from '../index';
import { homeBenefits } from '../environment/wellbeing';
import { WALKING } from './walking';

const base = newGame({ seed: 'walking-trips', now: 0 });
const defaultThresholds = { ...WALKING.thresholds };
const defaultWork = WALKING.workThreshold;

function withBuildings(state: GameState, specs: { type: BuildingType; x: number; y: number; tier?: number }[]): GameState {
  let nextId = state.nextId;
  const added: Building[] = specs.map((spec) => ({ ...createBuilding(nextId++, spec.type, spec.x, spec.y, 0), tier: spec.tier ?? 1 }));
  return { ...state, roads: [...state.roads], nextId, buildings: [...state.buildings, ...added] };
}

function homeOf(state: GameState): Building {
  return state.buildings.filter((building) => building.type === 'home').at(-1)!;
}

afterEach(() => {
  Object.assign(WALKING.thresholds, defaultThresholds);
  WALKING.enabled = true;
  WALKING.workThreshold = defaultWork;
});

describe('walking trips to services', () => {
  const city = () => withBuildings(base, [{ type: 'shop', x: 57, y: 57 }, { type: 'home', x: 56, y: 59 }]);

  it('sends Citizens to a shop within the threshold', () => {
    const stats = congestionStats(city());
    expect(stats.walkingTrips.shop).toBe(citizensOf(1) * WALKING.tripsPerCitizen.shop);
    expect(stats.walkingTrips.school).toBe(0);
  });

  it('adds no car load', () => {
    WALKING.workThreshold = 0;
    const withTrips = congestionStats(city());
    WALKING.enabled = false;
    const without = congestionStats(city());
    expect(withTrips.walkingTrips.shop).toBeGreaterThan(0);
    expect([...withTrips.sections]).toEqual([...without.sections]);
    expect(withTrips.commuters).toBe(without.commuters);
  });

  it('skips a shop beyond the threshold', () => {
    WALKING.thresholds.shop = 3;
    expect(congestionStats(city()).walkingTrips.shop).toBe(0);
  });

  it('loads the Crossing used to reach the other side of the road', () => {
    const state = city();
    const crossed = { ...state, roads: state.roads.map((road) => (road.x === 57 && road.y === 58 ? { ...road, kind: 'crossing' as const } : road)) };
    WALKING.thresholds.shop = 5;
    expect(congestionStats(state).walkingTrips.shop).toBe(0);
    const stats = congestionStats(crossed);
    expect(stats.walkingTrips.shop).toBe(citizensOf(1));
    expect(stats.pedestrians.get('57,58')).toBeGreaterThanOrEqual(citizensOf(1));
  });

  it('counts a tree as a park destination', () => {
    const stats = congestionStats(withBuildings(base, [{ type: 'tree', x: 58, y: 59 }, { type: 'home', x: 56, y: 59 }]));
    expect(stats.walkingTrips.park).toBe(citizensOf(1) * WALKING.tripsPerCitizen.park);
  });

  it('raises Well-being for Homes that can walk to services, never above the limit', () => {
    const state = city();
    const home = homeOf(state);
    const walking = homeBenefits(state, home);
    WALKING.enabled = false;
    const driving = homeBenefits({ ...state, roads: [...state.roads] }, home);
    expect(driving.walkingBonus).toBe(0);
    expect(walking.walkingBonus).toBeGreaterThan(0);
    expect(walking.wellbeing).toBeCloseTo(driving.wellbeing + walking.walkingBonus);
    expect(walking.wellbeing).toBeLessThanOrEqual(100);
  });

  it('is deterministic', () => {
    expect(congestionStats({ ...city() }).walkingTrips).toEqual(congestionStats(city()).walkingTrips);
  });
});
