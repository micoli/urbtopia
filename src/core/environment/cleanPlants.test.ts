import { describe, expect, it } from 'vitest';
import { copyThresholds, createBuilding, dispatch, ECOLOGY, energyStats, flowFactor, newGame, productionFactors, UTILITY_CAPACITY, type Building, type GameState } from '../index';

const H = ECOLOGY.hourMs;
const building = (id: number, type: Building['type'], x = 0, y = 0, extra: Partial<Building> = {}): Building => ({ ...createBuilding(id, type, x, y, 0), ...extra });
const lake = (count: number) => Array.from({ length: count }, (_, index) => ({ x: 50 + index, y: 50 }));
const city = (buildings: Building[], extra: Partial<GameState> = {}): GameState => ({
  ...newGame({ seed: 'clean-plants', now: 0 }), buildings, nextId: 100, urbs: 100_000, tutorial: null, roads: [], adaptationUntil: 0, ...extra,
});
const hydroBesideLake = (tier = 1) => building(1, 'hydroPlant', 50, 48, { tier });
const homes = (count: number) => Array.from({ length: count }, (_, index) => building(10 + index, 'home', 40 + index * 3, 40, { tier: 8 }));

describe('Hydro and geothermal Capacity', () => {
  it('gives each Tier its Capacity', () => {
    expect(UTILITY_CAPACITY.hydroPlant).toEqual([14, 28, 45]);
    expect(UTILITY_CAPACITY.geothermalPlant).toEqual([10, 20, 32]);
  });

  it('opens extra copies by Citizens', () => {
    expect(copyThresholds('hydroPlant')).toEqual([60, 120, 240]);
    expect(copyThresholds('geothermalPlant')).toEqual([150, 300, 600]);
  });
});

describe('Hydro power plant', () => {
  it('must touch a Water tile', () => {
    const base = city([building(2, 'home', 40, 40, { tier: 5 })], { waterTiles: lake(3) });
    expect(dispatch(base, { type: 'PlaceBuilding', buildingType: 'hydroPlant', x: 50, y: 48 }, 0)).toMatchObject({ ok: true });
    expect(dispatch(base, { type: 'PlaceBuilding', buildingType: 'hydroPlant', x: 56, y: 56 }, 0)).toMatchObject({ ok: false, error: { key: 'error.needsWater' } });
  });

  it('has a Flow factor of its connected Water tiles over 8, at most 1', () => {
    const plant = hydroBesideLake();
    expect(flowFactor(city([plant]), plant)).toBe(0);
    expect(flowFactor(city([plant], { waterTiles: lake(4) }), plant)).toBe(0.5);
    expect(flowFactor(city([plant], { waterTiles: lake(8) }), plant)).toBe(1);
    expect(flowFactor(city([plant], { waterTiles: lake(15) }), plant)).toBe(1);
  });

  it('ignores Water tiles it is not connected to', () => {
    const plant = hydroBesideLake();
    const apart = [{ x: 60, y: 60 }, { x: 61, y: 60 }, { x: 62, y: 60 }];
    expect(flowFactor(city([plant], { waterTiles: [...lake(2), ...apart] }), plant)).toBe(0.25);
  });

  it('follows a slow daily cycle between 80% and 100%', () => {
    const factors = Array.from({ length: 24 }, (_, hour) => productionFactors(hour * H).hydro);
    expect(Math.min(...factors)).toBeGreaterThanOrEqual(0.8);
    expect(Math.max(...factors)).toBeLessThanOrEqual(1);
    expect(Math.max(...factors) - Math.min(...factors)).toBeGreaterThan(0.15);
  });

  it('produces its Capacity times flow times the daily factor', () => {
    const state = city([hydroBesideLake(2), ...homes(3)], { waterTiles: lake(4), lastSeen: 5 * H });
    const expected = 28 * 0.5 * productionFactors(5 * H).hydro;
    expect(energyStats(state).hydro).toBeCloseTo(expected);
  });

  it('produces nothing without connected water', () => {
    expect(energyStats(city([hydroBesideLake(), ...homes(1)])).hydro).toBe(0);
  });
});

describe('Geothermal power plant', () => {
  it.each([0, 6, 12, 18, 23])('produces the same Capacity at hour %i', hour => {
    const state = city([building(1, 'geothermalPlant', 5, 5, { tier: 3 }), ...homes(1)], { lastSeen: hour * H });
    expect(energyStats(state).geothermal).toBe(32);
  });
});

describe('Clean plants in the supply order', () => {
  it('serve Demand before coal', () => {
    const state = city([building(1, 'geothermalPlant', 5, 5, { tier: 3 }), building(2, 'coalPlant', 8, 5), ...homes(1)]);
    const stats = energyStats(state);
    expect(stats.geothermal).toBeGreaterThan(0);
    expect(stats.coal).toBeLessThanOrEqual(Math.max(0, stats.demand - stats.geothermal));
    expect(stats.coalCostPerHour).toBe(stats.coal * ECOLOGY.coalCost);
  });

  it('charge a battery with their surplus', () => {
    const state = city([building(1, 'geothermalPlant', 5, 5, { tier: 3 }), building(2, 'battery', 7, 5, { storedEnergy: 0 })]);
    expect(energyStats(state).batteryRates.get(2)).toBeGreaterThan(0);
  });

  it('cost nothing to run and emit nothing', () => {
    const state = city([building(1, 'geothermalPlant', 5, 5, { tier: 3 }), hydroBesideLake(3), ...homes(1)], { waterTiles: lake(8) });
    const stats = energyStats(state);
    expect(stats.costPerHour).toBe(0);
    expect(stats.emissions).toBe(0);
  });
});
