import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { cityTransportStats, congestionStats, createBuilding, newGame, transportStats, type Building, type GameState } from '../index';
import { ECOLOGY } from '../environment/ecology';
import { WALKING } from './walking';

const walkingEnabled = WALKING.enabled;
beforeAll(() => {
  WALKING.enabled = false;
});
afterAll(() => {
  WALKING.enabled = walkingEnabled;
});

const start = newGame({ seed: 'bus-speed-effects', now: 0 });

function city(homeCount: number, lineCount: number): GameState {
  const homes: Building[] = Array.from({ length: homeCount }, (_, index) => ({ ...createBuilding(40 + index, 'home', 53 + 2 * index, 59, 0), tier: 7 }));
  const stops = [createBuilding(60, 'busStop', 59, 59, 0), createBuilding(61, 'busStop', 61, 59, 0)];
  return {
    ...start,
    roads: [...start.roads],
    adaptationUntil: 0,
    nextId: 100,
    buildings: [...start.buildings.map((building) => ({ ...building, tier: 8 })), ...homes, ...stops],
    busLines: Array.from({ length: lineCount }, (_, index) => ({ id: 20 + index, stops: [60, 61] })),
  };
}

describe('bus lines slowed by traffic', () => {
  it('lose capacity and speed in proportion to their effective speed', () => {
    const state = city(3, 1);
    const factor = congestionStats(state).busSpeeds.get(20)!.factor;
    const [line] = cityTransportStats(state).lines;
    expect(factor).toBeLessThan(1);
    expect(line!.speedFactor).toBeCloseTo(factor);
    expect(line!.speed).toBeCloseTo(line!.nominalSpeed * factor);
    expect(line!.capacity).toBeCloseTo(ECOLOGY.lineCapacity * factor);
  });

  it('carry fewer Riders than the same line on a free road', () => {
    const state = city(3, 1);
    const nominal = transportStats(state).riders;
    expect(cityTransportStats(state).riders - cityTransportStats(state).shiftedRiders).toBeLessThan(nominal);
  });

  it('keep their nominal capacity and speed when the road is free', () => {
    const state = city(1, 1);
    const [line] = cityTransportStats(state).lines;
    expect(line!.speedFactor).toBe(1);
    expect(line!.capacity).toBe(ECOLOGY.lineCapacity);
    expect(cityTransportStats(state).riders).toBe(transportStats(state).riders);
  });

  it('lengthen the itinerary time of their line', () => {
    const state = city(3, 1);
    const factors = congestionStats(state).speedFactors;
    const slow = transportStats(state, state.lastSeen, factors).lines[0]!;
    const free = transportStats(state).lines[0]!;
    expect(slow.speed).toBeLessThan(free.speed);
  });

  it('give the same result on repeated calls', () => {
    const state = city(3, 8);
    expect(cityTransportStats({ ...state }).riders).toBe(cityTransportStats(state).riders);
    expect([...congestionStats(state).speedFactors]).toEqual([...congestionStats({ ...state, roads: [...state.roads] }).speedFactors]);
  });
});
