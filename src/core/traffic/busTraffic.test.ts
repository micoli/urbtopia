import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { congestionStats, createBuilding, newGame, tileKey, type Building, type GameState } from '../index';
import { BUS_TRAFFIC, busSpeedFactor } from './busTraffic';
import { CONGESTION } from './roadTier';
import { WALKING } from './walking';

const walkingEnabled = WALKING.enabled;
beforeAll(() => {
  WALKING.enabled = false;
});
afterAll(() => {
  WALKING.enabled = walkingEnabled;
});

const start = newGame({ seed: 'bus-traffic', now: 0 });

function city(homeCount: number, withLine: boolean, tier = 1): GameState {
  const homes: Building[] = Array.from({ length: homeCount }, (_, index) => ({ ...createBuilding(40 + index, 'home', 53 + 2 * index, 59, 0), tier }));
  const stops = [createBuilding(60, 'busStop', 59, 59, 0), createBuilding(61, 'busStop', 61, 59, 0)];
  const buildings = [...start.buildings.map((building) => ({ ...building, tier: 8 })), ...homes, ...(withLine ? stops : [])];
  return { ...start, roads: [...start.roads], adaptationUntil: 0, nextId: 100, buildings, busLines: withLine ? [{ id: 20, stops: [60, 61] }] : [] };
}

describe('bus load on the roads', () => {
  it('loads every tile of an active Bus line, even where no car drives', () => {
    const stats = congestionStats(city(1, true));
    const tile = stats.sections.get(tileKey({ x: 60, y: 58 }))!;
    expect(tile.load).toBe(BUS_TRAFFIC.load);
    expect(tile.ratio).toBeCloseTo(BUS_TRAFFIC.load / tile.capacity);
  });

  it('adds nothing for a line that is not active', () => {
    const state = { ...city(1, true), urbs: 0 };
    expect(congestionStats(state).sections.has(tileKey({ x: 60, y: 58 }))).toBe(false);
    expect(congestionStats(state).busSpeeds.size).toBe(0);
  });

  it('can saturate a street used only by buses when many lines share it', () => {
    const base = city(1, true);
    const lines = Array.from({ length: 6 }, (_, index) => ({ id: 20 + index, stops: [60, 61] }));
    const stats = congestionStats({ ...base, busLines: lines, roads: [...base.roads] });
    expect(stats.sections.get(tileKey({ x: 60, y: 58 }))!.ratio).toBeGreaterThan(1);
    expect(stats.worstBottleneck).not.toBeNull();
  });

  it('keeps a line at full speed on a free road', () => {
    const stats = congestionStats(city(1, true));
    expect(stats.busSpeeds.get(20)).toEqual({ factor: 1, slowed: false });
    expect(stats.slowedLines).toBe(0);
  });

  it('slows a line that drives on a jammed road', () => {
    const stats = congestionStats(city(3, true, 7));
    const speed = stats.busSpeeds.get(20)!;
    expect(speed.factor).toBeLessThan(1);
    expect(speed.factor).toBeGreaterThanOrEqual(0.5);
    expect(speed.slowed).toBe(true);
    expect(stats.slowedLines).toBe(1);
    expect(stats.speedFactors.get(20)).toBe(speed.factor);
  });

  it('is deterministic', () => {
    expect(congestionStats({ ...city(3, true, 7) }).busSpeeds).toEqual(congestionStats(city(3, true, 7)).busSpeeds);
  });
});

describe('busSpeedFactor', () => {
  const route = [0, 1, 2, 3].map((x) => ({ x, y: 0 }));

  it('is 1 when no tile is above capacity', () => {
    expect(busSpeedFactor(route, () => 0.8)).toBe(1);
  });

  it('counts every jammed tile', () => {
    const one = busSpeedFactor(route, (key) => (key === tileKey(route[1]!) ? 2 : 0));
    const two = busSpeedFactor(route, (key) => (key === tileKey(route[1]!) || key === tileKey(route[2]!) ? 2 : 0));
    expect(one).toBeCloseTo(4 / 5);
    expect(two).toBeCloseTo(4 / 6);
  });

  it('never goes below half of the nominal speed', () => {
    expect(busSpeedFactor(route, () => 10)).toBeCloseTo(1 / CONGESTION.maxRatio);
  });
});
