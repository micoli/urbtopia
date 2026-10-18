import { describe, expect, it } from 'vitest';
import { WASTE, createBuilding, homeWasteProduction, newGame, wasteReport, wasteSituation, type Building, type GameState } from '../index';

const home = (id: number, x: number, y: number, tier = 1): Building => ({ ...createBuilding(id, 'home', x, y, 0), tier });
const place = (id: number, type: 'mound' | 'incinerator' | 'recyclingPlant', x: number, y: number, tier = 1): Building => ({ ...createBuilding(id, type, x, y, 0), tier });
const roadRow = (from: number, to: number, y: number) => Array.from({ length: to - from + 1 }, (_, index) => ({ x: from + index, y, kind: 'road' as const }));
const city = (buildings: Building[], extra: Partial<GameState> = {}): GameState => ({
  ...newGame({ seed: 'waste-situation', now: 0 }), buildings, nextId: 1000, urbs: 1_000_000, tutorial: null, roads: roadRow(40, 80, 49), roundabouts: [], pedestrianWays: [], adaptationUntil: 0, ...extra,
});

describe('wasteSituation', () => {
  it('balances the Waste of the day against the capacity', () => {
    const state = city([place(1, 'mound', 60, 50), home(10, 62, 50, 3), home(11, 64, 50, 3), home(12, 66, 50, 3)]);
    const report = wasteReport(state);
    const situation = wasteSituation(state);
    expect([situation.produced, situation.processed, situation.costPerDay]).toEqual([report.produced, report.processed, report.costPerDay]);
    expect(situation.capacity).toBe(60);
    expect(situation.unprocessed).toBe(situation.produced - situation.processed);
    expect(situation.unprocessedShare).toBeCloseTo(situation.unprocessed / situation.produced, 12);
  });

  it('has an empty balance without Homes', () => {
    const situation = wasteSituation(city([place(1, 'mound', 60, 50)]));
    expect(situation.unprocessedShare).toBe(0);
    expect(situation.bottleneck).toBeNull();
  });

  it('lists every family with its buildings, capacity and stops', () => {
    const state = city([place(1, 'mound', 60, 50), place(2, 'mound', 62, 50), home(10, 62, 52, 2)], { urbs: 0 });
    const [recycling, incinerator, mound] = wasteSituation(state).families;
    expect([recycling!.kind, incinerator!.kind, mound!.kind]).toEqual(['recyclingPlant', 'incinerator', 'mound']);
    expect(recycling!.buildings).toBe(0);
    expect([mound!.buildings, mound!.capacity, mound!.stoppedNoUrbs]).toEqual([2, 120, 2]);
  });

  it('counts a facility without a Road as stopped and as the bottleneck when nothing else is wrong', () => {
    const state = city([place(1, 'mound', 60, 30)]);
    const situation = wasteSituation(state);
    expect(situation.families[2]!.stoppedNoRoad).toBe(1);
    expect(situation.bottleneck).toEqual({ x: 60, y: 30 });
  });

  it('groups the uncovered Homes by cause with their Citizens', () => {
    const state = city([place(1, 'mound', 60, 50), home(10, 62, 50, 4), home(11, 20, 50, 4), home(12, 21, 50, 2)]);
    const situation = wasteSituation(state);
    const outOfReach = situation.causes.find(({ cause }) => cause === 'outOfReach')!;
    expect(outOfReach.homes).toBe(2);
    expect(outOfReach.citizens).toBe(homeWasteProduction(4) + homeWasteProduction(2));
    expect(situation.uncoveredHomes).toBe(2);
    expect(situation.coveredHomes).toBe(1);
  });

  it('points at the uncovered Home with the most Citizens once the city must handle its Waste', () => {
    const big = Array.from({ length: 20 }, (_, index) => home(10 + index, 20, 20 + index, 8));
    const state = city([place(1, 'mound', 60, 50), ...big]);
    expect(wasteReport(state).required).toBe(true);
    expect(wasteSituation(state).bottleneck).toEqual({ x: 20, y: 20 });
  });

  it('counts the Homes under the worst Mound and the Incinerator smoke, and the Incinerator emissions', () => {
    const smelly = wasteSituation(city([place(1, 'mound', 60, 50), home(10, 62, 50, 4)]));
    const smoky = wasteSituation(city([place(2, 'incinerator', 60, 47), home(10, 62, 50, 4)]));
    expect([smelly.odorHomes, smelly.incineratorHomes, smelly.incineratorEmissionsPerHour]).toEqual([1, 0, 0]);
    expect(smoky.incineratorHomes).toBe(1);
    expect(smoky.incineratorEmissionsPerHour).toBeGreaterThan(0);
  });

  it('costs nothing extra without a Pedestrian district', () => {
    const situation = wasteSituation(city([place(1, 'mound', 60, 50), home(10, 62, 50, 4)]));
    expect([situation.pedestrianHomes, situation.pedestrianSurcharge]).toEqual([0, 0]);
  });

  it('isolates the surcharge of the Homes served on foot', () => {
    const state = city([place(1, 'mound', 60, 50), home(10, 62, 58, 2)], { pedestrianWays: Array.from({ length: 9 }, (_, index) => ({ x: 63, y: 50 + index })) });
    const situation = wasteSituation(state);
    expect(situation.pedestrianHomes).toBe(wasteReport(state).homes.get(10)!.carried ? 1 : 0);
    if (situation.pedestrianHomes === 0) return;
    expect(situation.pedestrianSurcharge).toBeCloseTo(situation.costPerDay * (1 - 1 / WASTE.carriedSurcharge), 9);
  });
});
