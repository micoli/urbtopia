import { afterEach, describe, expect, it } from 'vitest';
import { WALKING } from '../traffic/walking';
import { citizensOf, congestionStats, createBuilding, newGame, type Building, type BuildingType, type GameState } from '../index';
import { layerFieldsOf } from './fields';
import { pedestrianCrossingsField, sidewalkField } from './pedestrianFields';

const base = newGame({ seed: 'pedestrian-fields', now: 0 });

function withBuildings(state: GameState, specs: { type: BuildingType; x: number; y: number }[]): GameState {
  let nextId = state.nextId;
  const added: Building[] = specs.map((spec) => ({ ...createBuilding(nextId++, spec.type, spec.x, spec.y, 0), tier: 1 }));
  return { ...state, roads: [...state.roads], nextId, buildings: [...state.buildings, ...added] };
}

const city = () => withBuildings(base, [{ type: 'shop', x: 57, y: 57 }, { type: 'home', x: 56, y: 59 }]);

afterEach(() => {
  WALKING.enabled = true;
});

describe('sidewalk field', () => {
  it('sums the walking trips passing along each tile', () => {
    const state = city();
    const stats = congestionStats(state);
    expect(stats.sidewalkLoads.size).toBeGreaterThan(0);
    const field = sidewalkField(state);
    const total = [...stats.sidewalkLoads.values()].reduce((sum, load) => sum + load, 0);
    expect(field.values.reduce((sum, value) => sum + value, 0)).toBeCloseTo(total);
    expect(field.max).toBeCloseTo(Math.max(...field.values));
  });

  it('carries at least the trips of one Home on its busiest tile', () => {
    expect(sidewalkField(city()).max).toBeGreaterThanOrEqual(citizensOf(1) * WALKING.tripsPerCitizen.shop);
  });

  it('is empty when nobody walks', () => {
    WALKING.enabled = false;
    expect(Math.max(...sidewalkField(city()).values)).toBe(0);
  });

  it('leaves the congestion results unchanged', () => {
    const withTrips = congestionStats(city());
    expect(withTrips.walkingTrips.shop).toBe(citizensOf(1) * WALKING.tripsPerCitizen.shop);
  });
});

describe('crossings field', () => {
  it('reads each Crossing against its saturation threshold, in percent', () => {
    const state = city();
    const field = pedestrianCrossingsField(state);
    expect(field.max).toBe(100);
    expect(Math.max(...field.values)).toBeLessThanOrEqual(100);
    const stats = congestionStats(state);
    for (const crossing of stats.crossings.values()) {
      const expected = Math.min(100, 100 * crossing.cut / WALKING.maxCrossingCut);
      expect(field.values[crossing.tile.y * field.size + crossing.tile.x]).toBeCloseTo(expected);
    }
  });
});

describe('Movement layers', () => {
  it('draw roads, sidewalks and crossings together in All', () => {
    expect(layerFieldsOf(city(), 'movement.all', 'education').map(({ ramp }) => ramp)).toEqual(['road', 'sidewalk', 'saturation']);
    expect(layerFieldsOf(city(), 'movement.pedestrians', 'education').map(({ ramp }) => ramp)).toEqual(['sidewalk', 'saturation']);
  });
});
