import { describe, expect, it } from 'vitest';
import { createBuilding, newGame, transportStats, type GameState, type TransitTile } from '../index';

const strip = (x: number, y: number, length: number): TransitTile[] => Array.from({ length }, (_, i) => ({ x: x + i, y, exits: i === 0 ? ['E'] : i === length - 1 ? ['W'] : ['W', 'E'] }));
const roads = (length: number) => Array.from({ length }, (_, x) => ({ x, y: 0, kind: 'road' as const }));

function base(): GameState {
  return { ...newGame({ seed: 'cyclists', now: 0 }), ownedParcels: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }], urbs: 100_000, nextId: 100, adaptationUntil: 0, roundabouts: [],
    storage: { materials: { coal: 10 }, goods: {} }, transitFleet: [{ id: 12, kind: 'trainCoal', purchasePrice: 1600, lineId: 11 }] };
}

const withHomeAndFactory = (homeTier: number, factoryX: number) => [{ ...createBuilding(1, 'home', 0, 2, 0), tier: homeTier }, createBuilding(2, 'factory', factoryX, 2, 0)];

function railCity(homeTier = 3): GameState {
  return { ...base(), buildings: [...withHomeAndFactory(homeTier, 42), createBuilding(3, 'railStation', 12, 1, 0), createBuilding(4, 'railStation', 30, 1, 0)],
    rails: strip(0, 0, 45), roads: [], transitLines: [{ id: 11, mode: 'rail', stops: [3, 4], peakHeadway: 5, offPeakHeadway: 10 }] };
}

describe('Cyclist Riders', () => {
  it('reach a rail station twelve tiles away and an activity twelve tiles from the other', () => {
    const stats = transportStats(railCity());
    expect(stats.riders).toBeCloseTo(32 * .7);
    expect(stats.lines[0]!.cyclists).toBeCloseTo(stats.riders);
  });

  it('cannot do the same with bus stops, which keep their six tiles', () => {
    const state = { ...railCity(), rails: [], roads: roads(45), buildings: railCity().buildings.map(b => b.type === 'railStation' ? { ...b, type: 'busStop' as const } : b),
      transitLines: [], transitFleet: [], busLines: [{ id: 11, stops: [3, 4] }] };
    expect(transportStats(state).riders).toBe(0);
  });

  it('take two places per line, a pedestrian one', () => {
    const state = { ...railCity(8), transitLines: [{ id: 11, mode: 'rail' as const, stops: [3, 4], peakHeadway: 5, offPeakHeadway: 60 }] };
    const line = transportStats(state).lines[0]!;
    expect(line.cyclists).toBeGreaterThan(0);
    expect(line.riders + line.cyclists).toBeLessThanOrEqual(line.capacity + 1e-9);
    expect(line.riders).toBeLessThan(line.capacity);
  });

  it('walk, not cycle, when the stops are within six tiles', () => {
    const state = { ...railCity(), buildings: [...withHomeAndFactory(3, 42), createBuilding(3, 'railStation', 4, 1, 0), createBuilding(4, 'railStation', 40, 1, 0)] };
    const line = transportStats(state).lines[0]!;
    expect(line.riders).toBeGreaterThan(0);
    expect(line.cyclists).toBe(0);
  });

  it('never ride a bus leg: the bicycle does not board an ordinary bus', () => {
    const state: GameState = { ...base(), roads: roads(60), rails: strip(0, 0, 25),
      buildings: [...withHomeAndFactory(3, 54), createBuilding(3, 'railStation', 12, 1, 0), createBuilding(4, 'transitHub', 22, 1, 0), createBuilding(5, 'busStop', 48, 1, 0)],
      transitLines: [{ id: 11, mode: 'rail', stops: [3, 4], peakHeadway: 5, offPeakHeadway: 10 }], busLines: [{ id: 10, stops: [4, 5] }] };
    expect(transportStats(state).riders).toBe(0);
  });
});
