import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { WALKING } from './walking';
import { citizensOf, cityTransportStats, congestionStats, createBuilding, jobsOf, newGame, transportStats, type Building, type GameState, type TransitTile } from '../index';

const walkingEnabled = WALKING.enabled;
beforeAll(() => {
  WALKING.enabled = false;
});
afterAll(() => {
  WALKING.enabled = walkingEnabled;
});

const HOME_TIER = 7;
const start = newGame({ seed: 'job-search', now: 0 });
const workplaces = start.buildings.map((building) => ({ ...building, tier: 8 }));
const sum = (values: Iterable<number>) => [...values].reduce((total, value) => total + value, 0);

function city(homeCount: number, lineCount: number, buildings: Building[] = workplaces): GameState {
  const homes: Building[] = Array.from({ length: homeCount }, (_, index) => ({ ...createBuilding(40 + index, 'home', 53 + 2 * index, 59, 0), tier: HOME_TIER }));
  const stops = lineCount > 0 ? [createBuilding(60, 'busStop', 59, 59, 0), createBuilding(61, 'busStop', 61, 59, 0)] : [];
  return {
    ...start,
    adaptationUntil: 0,
    nextId: 100,
    buildings: [...buildings, ...homes, ...stops],
    busLines: Array.from({ length: lineCount }, (_, index) => ({ id: 20 + index, stops: [60, 61] })),
  };
}

describe('every Citizen looks for a Job', () => {
  it('counts every Citizen once: in a Job or Unemployed', () => {
    for (const state of [city(2, 0), city(3, 4), city(6, 8)]) {
      const stats = congestionStats(state);
      const citizens = sum(state.buildings.filter((building) => building.type === 'home').map((home) => citizensOf(home.tier)));
      expect(sum(stats.filledJobs.values()) + stats.unemployed).toBeCloseTo(citizens);
      expect(sum(stats.filledJobs.values())).toBeCloseTo(stats.modes.car + stats.modes.transit + stats.modes.walking + stats.modes.cycling);
    }
  });

  it('shows the Citizens who find no Job as Unemployed, a statistic only', () => {
    const state = city(4, 0);
    const stats = congestionStats(state);
    expect(stats.jobs).toBe(sum(workplaces.map(jobsOf)));
    expect(stats.unemployed).toBeCloseTo(4 * citizensOf(HOME_TIER) - stats.jobs);
    expect(stats.unemployed).toBeGreaterThan(0);
  });

  it('gives the same result whatever the order of the buildings', () => {
    const state = city(4, 3);
    const shuffled = { ...state, buildings: [...state.buildings].reverse() };
    const a = congestionStats(state);
    const b = congestionStats(shuffled);
    expect(b.unemployed).toBeCloseTo(a.unemployed);
    expect(b.modes).toEqual(a.modes);
    expect([...b.filledJobs].sort()).toEqual([...a.filledJobs].sort());
  });

  it('staffs an Office with Riders', () => {
    const office = { ...createBuilding(30, 'office', 60, 61, 0), tier: 1 };
    const stats = congestionStats(city(2, 3, [...workplaces, office]));
    expect(stats.jobs).toBe(sum([...workplaces, office].map(jobsOf)));
    expect(stats.filledJobs.has(30)).toBe(true);
  });
});

describe('Mode choice by travel time', () => {
  const strip = (x: number, length: number): TransitTile[] => Array.from({ length }, (_, i) => ({ x: x + i, y: 0, exits: i === 0 ? ['E'] : i === length - 1 ? ['W'] : ['W', 'E'] }));
  const road = (length: number) => Array.from({ length }, (_, x) => ({ x, y: 0, kind: 'road' as const }));

  // A Home and a Factory 40 tiles apart on a Road, with a rail line between two stations beside them.
  function railCity({ homeTier = 3, offPeakHeadway = 10, rail = true } = {}): GameState {
    return {
      ...newGame({ seed: 'mode-choice', now: 0 }), ownedParcels: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }], urbs: 100_000, nextId: 100, adaptationUntil: 0, roundabouts: [],
      storage: { materials: { coal: 10 }, goods: {} },
      buildings: [{ ...createBuilding(1, 'home', 1, 1, 0), tier: homeTier }, { ...createBuilding(2, 'factory', 42, 1, 0), tier: 5 }, createBuilding(3, 'railStation', 4, 1, 0), createBuilding(4, 'railStation', 40, 1, 0)],
      roads: road(45), rails: rail ? strip(0, 45) : [],
      transitLines: rail ? [{ id: 11, mode: 'rail', stops: [3, 4], peakHeadway: 5, offPeakHeadway }] : [],
      transitFleet: rail ? [{ id: 12, kind: 'trainCoal', purchasePrice: 1600, lineId: 11 }] : [],
    };
  }

  it('prefers the rail line to a long drive', () => {
    const stats = congestionStats(railCity());
    expect(stats.modes.transit).toBeGreaterThan(0);
    expect(stats.modes.car).toBeLessThan(citizensOf(3));
  });

  it('drives where there is no line', () => {
    const stats = congestionStats(railCity({ rail: false }));
    expect(stats.modes.transit).toBe(0);
    expect(stats.modes.car).toBeGreaterThan(0);
  });

  it('sends only as many Citizens to a line as it can carry, the others drive', () => {
    const state = railCity({ homeTier: 8, offPeakHeadway: 90 });
    const [line] = transportStats(state).lines;
    const stats = congestionStats(state);
    expect(line!.riders).toBeLessThanOrEqual(line!.capacity + 1e-9);
    expect(stats.modes.transit).toBeCloseTo(line!.riders);
    expect(stats.modes.car).toBeGreaterThan(0);
  });

  it('counts a Rider as having a Job and never as a driver', () => {
    const stats = congestionStats(railCity());
    expect(stats.filledJobs.get(2)).toBeCloseTo(stats.modes.transit + stats.modes.car);
    expect(stats.carArrivals.get(2) ?? 0).toBeCloseTo(stats.modes.car);
  });

  it('slows the cars of a saturated road, which sends more Citizens to the line', () => {
    const light = congestionStats(railCity({ homeTier: 3 }));
    const heavy = congestionStats({ ...railCity({ homeTier: 8 }), transitLines: [{ id: 11, mode: 'rail', stops: [3, 4], peakHeadway: 5, offPeakHeadway: 10 }] });
    expect(heavy.modes.transit / (heavy.modes.transit + heavy.modes.car)).toBeGreaterThanOrEqual(light.modes.transit / (light.modes.transit + light.modes.car) - 1e-9);
  });

  it('keeps every Rider within the capacity of the lines they use', () => {
    for (const line of cityTransportStats(railCity({ homeTier: 8, offPeakHeadway: 90 })).lines) expect(line.riders + line.cyclists).toBeLessThanOrEqual(line.capacity + 1e-9);
  });
});
