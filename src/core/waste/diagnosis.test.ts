import { describe, expect, it } from 'vitest';
import { citizensOf, createBuilding, newGame, wasteSituation, type Building, type GameState } from '../index';
import { diagnoseWaste } from './diagnosis';

const home = (id: number, x: number, y: number, tier = 8): Building => ({ ...createBuilding(id, 'home', x, y, 0), tier });
const place = (id: number, type: 'mound' | 'incinerator' | 'recyclingPlant', x: number, y: number, tier = 1): Building => ({ ...createBuilding(id, type, x, y, 0), tier });
const roadRow = (from: number, to: number, y: number) => Array.from({ length: to - from + 1 }, (_, index) => ({ x: from + index, y, kind: 'road' as const }));
const city = (buildings: Building[], extra: Partial<GameState> = {}): GameState => ({
  ...newGame({ seed: 'waste-diagnosis', now: 0 }), buildings, nextId: 1000, urbs: 1_000_000, tutorial: null, roads: roadRow(40, 80, 49), roundabouts: [], pedestrianWays: [], adaptationUntil: 0, ...extra,
});
const homes = (count: number, firstId = 10, x = 42, y = 50): Building[] => Array.from({ length: count }, (_, index) => home(firstId + index, x + index * 2, y));
const mounds = (count: number): Building[] => Array.from({ length: count }, (_, index) => place(1 + index, 'mound', 59 + index, 50, 3));
const keysOf = (state: GameState) => diagnoseWaste(state).causes.map(cause => cause.key);

describe('diagnoseWaste', () => {
  it('has a big enough city to be expected to handle its Waste', () => {
    expect(wasteSituation(city([...homes(10)])).required).toBe(true);
    expect(citizensOf(8) * 10).toBeGreaterThan(800);
  });

  it('says nothing about a city too small to be expected to handle its Waste', () => {
    expect(diagnoseWaste(city([home(10, 42, 50, 1)])).causes).toEqual([]);
  });

  it('says nothing during the Adaptation period', () => {
    expect(diagnoseWaste(city(homes(10), { adaptationUntil: Number.MAX_SAFE_INTEGER })).causes).toEqual([]);
  });

  it('tells a city with no Waste facility to build one, and nothing more', () => {
    const { causes } = diagnoseWaste(city(homes(10)));
    expect(causes.map(cause => cause.key)).toEqual(['diagnosis.waste.noFacility']);
    expect(causes[0]!.weight).toBe(1);
  });

  it('says nothing about Waste coverage when every Home is covered', () => {
    const state = city([...mounds(6), home(10, 58, 50), home(11, 65, 50)]);
    expect(wasteSituation(state).uncoveredHomes).toBe(0);
    const keys = keysOf(state);
    expect(keys.filter(key => key !== 'diagnosis.waste.odor')).toEqual([]);
  });

  it('blames the capacity when the facilities are full', () => {
    const state = city([place(1, 'mound', 60, 50), ...homes(10)]);
    const cause = diagnoseWaste(state).causes.find(entry => entry.key === 'diagnosis.waste.capacityShort')!;
    expect(cause).toBeDefined();
    expect(cause.params.capacity).toBe(wasteSituation(state).capacity);
    expect(cause.params.missing).toBe(Math.round(wasteSituation(state).unprocessed));
    expect(cause.weight).toBeGreaterThan(0);
    expect(cause.weight).toBeLessThanOrEqual(1);
  });

  it('names why the facilities are stopped', () => {
    const near = [home(10, 58, 50), home(11, 62, 50)];
    expect(keysOf(city([place(1, 'mound', 60, 50), ...near], { urbs: 0 }))).toContain('diagnosis.waste.stopped.noUrbs');
    expect(keysOf(city([place(1, 'mound', 60, 53), ...near]))).toContain('diagnosis.waste.stopped.noRoad');
  });

  it('counts the Homes with no road link to a facility in their reach', () => {
    const state = city([...mounds(6), home(10, 58, 50), home(11, 65, 50), home(12, 60, 56, 5)]);
    const cause = diagnoseWaste(state).causes.find(entry => entry.key === 'diagnosis.waste.noRoadLink');
    expect(cause?.params.homes).toBe(1);
    expect(cause?.focus).toEqual([{ x: 60, y: 56 }]);
  });

  it('counts the Homes out of reach of every facility', () => {
    const state = city([place(1, 'mound', 41, 50), ...homes(2, 10, 70)]);
    const cause = diagnoseWaste(state).causes.find(entry => entry.key === 'diagnosis.waste.farFromFacilities');
    expect(cause).toBeDefined();
    expect(cause!.params.homes).toBeGreaterThan(0);
  });

  it('warns about the smell of the Mounds that process Waste near Homes', () => {
    const state = city([...mounds(6), home(10, 58, 50), home(11, 65, 50)]);
    expect(keysOf(state)).toContain('diagnosis.waste.odor');
  });

  it('orders the Causes by the Citizens they hurt, at most three', () => {
    const { causes } = diagnoseWaste(city([place(1, 'mound', 60, 50), ...homes(10), home(90, 61, 56)]));
    expect(causes.length).toBeLessThanOrEqual(3);
    const weights = causes.map(cause => cause.weight);
    expect(weights).toEqual([...weights].sort((a, b) => b - a));
  });

  it('does not depend on the order of the buildings', () => {
    const state = city([place(1, 'mound', 60, 50), ...homes(10), home(90, 61, 56)]);
    expect(diagnoseWaste({ ...state, buildings: [...state.buildings].reverse() }).causes).toEqual(diagnoseWaste(state).causes);
  });
});
