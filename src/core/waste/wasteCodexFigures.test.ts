import { describe, expect, it } from 'vitest';
import { wasteCodexFigures, wasteFacilityFigures } from './wasteCodexFigures';
import { WASTE, WASTE_FACILITIES, createBuilding, newGame, wasteEmissions, wasteReport, type Building, type GameState } from '../index';

const home = (id: number, x: number, y: number, tier = 1): Building => ({ ...createBuilding(id, 'home', x, y, 0), tier });
const place = (id: number, type: 'mound' | 'incinerator' | 'recyclingPlant', x: number, y: number, tier = 1): Building => ({ ...createBuilding(id, type, x, y, 0), tier });
const roadRow = (from: number, to: number, y: number) => Array.from({ length: to - from + 1 }, (_, index) => ({ x: from + index, y, kind: 'road' as const }));
const city = (buildings: Building[], extra: Partial<GameState> = {}): GameState => ({
  ...newGame({ seed: 'waste-summary', now: 0 }), buildings, nextId: 1000, urbs: 1_000_000, tutorial: null, roads: roadRow(40, 80, 49), roundabouts: [], pedestrianWays: [], adaptationUntil: 0, ...extra,
});

describe('wasteCodexFigures', () => {
  it('reports the totals of the simulation report', () => {
    const state = city([place(1, 'incinerator', 60, 47), home(10, 62, 50, 4), home(11, 64, 50, 4)]);
    const report = wasteReport(state);
    const summary = wasteCodexFigures(state);
    expect([summary.produced, summary.processed, summary.costPerDay]).toEqual([report.produced, report.processed, report.costPerDay]);
    expect(summary.uncoveredHomes).toBe(0);
    expect(summary.surchargeCostPerDay).toBe(0);
    expect(summary.surchargeShare).toBe(0);
    expect(summary.nuisance.incinerator.emissionsPerHour).toBe(wasteEmissions(state));
  });

  it('lists the facilities from clean to dirty with their figures', () => {
    const state = city([place(1, 'mound', 60, 50), place(2, 'mound', 62, 50), place(3, 'recyclingPlant', 50, 47), home(10, 62, 50, 4)]);
    const summary = wasteCodexFigures(state);
    expect(summary.kinds.map(({ kind }) => kind)).toEqual(['recyclingPlant', 'incinerator', 'mound']);
    const mound = summary.kinds[2]!;
    expect([mound.buildings, mound.capacity]).toEqual([2, 120]);
    expect(summary.kinds[1]!.buildings).toBe(0);
    expect(summary.kinds[1]!.stopped).toBeNull();
  });

  it('counts the uncovered Homes by cause', () => {
    const state = city([place(1, 'mound', 60, 50), home(10, 62, 50, 4), home(11, 20, 50, 4)]);
    const summary = wasteCodexFigures(state);
    expect(summary.uncoveredHomes).toBe(1);
    expect(summary.causes.outOfReach).toBe(1);
    expect(Object.values(summary.causes).reduce((sum, count) => sum + count, 0)).toBe(summary.uncoveredHomes);
  });

  it('says the facilities are stopped with no Urbs', () => {
    const state = city([place(1, 'mound', 60, 50), home(10, 62, 50, 4)], { urbs: 0 });
    const summary = wasteCodexFigures(state);
    expect(summary.kinds[2]!.stopped).toBe('noUrbs');
    expect(summary.processed).toBe(0);
    expect(summary.causes.facilityStopped).toBe(1);
  });

  it('says a Recycling plant without power is stopped', () => {
    const summary = wasteCodexFigures(city([place(1, 'recyclingPlant', 50, 47), home(10, 52, 50, 4)]));
    expect(summary.kinds[0]!.stopped).toBe('powerShortage');
    expect([summary.kinds[0]!.capacity, summary.kinds[0]!.nominalCapacity]).toEqual([0, 400]);
  });

  it('isolates the surcharge of the Homes served on foot', () => {
    const road = city([place(1, 'incinerator', 66, 47), home(10, 70, 48)]);
    expect(wasteCodexFigures(road).carried).toEqual({ homes: 0, distance: WASTE.carryingDistance, surcharge: WASTE.carriedSurcharge });
    expect(wasteCodexFigures(road).surchargeShare).toBe(0);
    const walking = city([place(1, 'incinerator', 66, 47), home(10, 71, 53)], { pedestrianWays: Array.from({ length: 4 }, (_, index) => ({ x: 70, y: 50 + index })) });
    const figures = wasteCodexFigures(walking);
    expect(figures.carried.homes).toBe(1);
    expect(figures.surchargeCostPerDay).toBeCloseTo(figures.costPerDay * (1 - 1 / WASTE.carriedSurcharge), 9);
    expect(figures.surchargeShare).toBeCloseTo(1 - 1 / WASTE.carriedSurcharge, 9);
  });

  it('counts the Homes under the worst Mound and under Incinerator smoke', () => {
    const smelly = wasteCodexFigures(city([place(1, 'mound', 60, 50), home(10, 62, 50, 4)])).nuisance;
    const smoky = wasteCodexFigures(city([place(2, 'incinerator', 60, 47), home(10, 62, 50, 4)])).nuisance;
    expect(smelly.mound.homesAffected).toBe(1);
    expect(smoky.incinerator.homesAffected).toBe(1);
    expect(smelly.incinerator.homesAffected).toBe(0);
    expect(smelly.mound.radius).toBe(WASTE_FACILITIES.mound.odor!.radius);
    expect(smoky.incinerator.malus).toBe(WASTE_FACILITIES.incinerator.pollution!.malus);
  });
});

describe('wasteFacilityFigures', () => {
  it('reports the full capacity of a running facility', () => {
    const state = city([place(1, 'mound', 60, 50), home(10, 62, 50, 4)]);
    const figures = wasteFacilityFigures(state, 1)!;
    expect([figures.capacity, figures.nominalCapacity, figures.loss]).toEqual([60, 60, null]);
    expect(figures.processed).toBe(wasteReport(state).facilities.get(1)!.processed);
  });

  it('drops the capacity to zero with no Urbs', () => {
    const figures = wasteFacilityFigures(city([place(1, 'mound', 60, 50), home(10, 62, 50, 4)], { urbs: 0 }), 1)!;
    expect([figures.capacity, figures.nominalCapacity, figures.loss]).toEqual([0, 60, 'noUrbs']);
  });

  it('says a Recycling plant without power is stopped', () => {
    const figures = wasteFacilityFigures(city([place(1, 'recyclingPlant', 50, 47), home(10, 52, 50, 4)]), 1)!;
    expect([figures.capacity, figures.nominalCapacity, figures.loss]).toEqual([0, 400, 'powerShortage']);
  });

  it('has no figures for a building that is not a Waste facility', () => {
    expect(wasteFacilityFigures(city([home(10, 62, 50, 4)]), 10)).toBeNull();
  });
});
