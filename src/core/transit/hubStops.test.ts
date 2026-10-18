import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { WALKING } from '../traffic/walking';
import { createBuilding, newGame, routeFailure, transportStats, type GameState, type TransitTile } from '../index';
import { validateGameState } from '../../persistence/validate';

const strip = (x: number, y: number, length: number): TransitTile[] => Array.from({ length }, (_, i) => ({ x: x + i, y, exits: i === 0 ? ['E'] : i === length - 1 ? ['W'] : ['W', 'E'] }));

function hubCity(): GameState {
  return { ...newGame({ seed: 'hub-stops', now: 0 }), ownedParcels: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }], urbs: 100_000, nextId: 100, adaptationUntil: 0, roundabouts: [],
    buildings: [
      { ...createBuilding(1, 'home', 0, 2, 0), tier: 3 }, createBuilding(2, 'factory', 30, 2, 0),
      createBuilding(3, 'busStop', 0, 1, 0), createBuilding(4, 'transitHub', 14, 1, 0), createBuilding(6, 'railStation', 30, 1, 0),
    ],
    roads: Array.from({ length: 16 }, (_, x) => ({ x, y: 0, kind: 'road' as const })), rails: strip(16, 0, 17),
    busLines: [{ id: 10, stops: [3, 4] }], transitLines: [{ id: 11, mode: 'rail', stops: [4, 6], peakHeadway: 5, offPeakHeadway: 10 }],
    transitFleet: [{ id: 12, kind: 'trainCoal', purchasePrice: 1600, lineId: 11 }], storage: { materials: { coal: 10 }, goods: {} } };
}

describe('Transit hub as a stop', () => {
  const cyclingFactor = WALKING.cyclingFactor;
  beforeEach(() => { WALKING.cyclingFactor = 1; });
  afterEach(() => { WALKING.cyclingFactor = cyclingFactor; });

  it('serves a bus line and a rail line at once', () => {
    const state = hubCity();
    expect(routeFailure(state, state.busLines![0]!)).toBeNull();
    expect(routeFailure(state, state.transitLines![0]!)).toBeNull();
  });

  it('links the two lines through a Transfer at the hub', () => {
    const stats = transportStats(hubCity());
    expect(stats.riders).toBeCloseTo(32 * .7);
    expect(stats.transferRiders).toBe(stats.riders);
    expect(stats.lines.map(l => l.riders)).toEqual([stats.riders, stats.riders]);
  });

  it('allows a hub only once in a line', () => {
    const state = hubCity();
    expect(routeFailure(state, { id: 10, stops: [3, 4, 4] })).toBe('invalid');
  });

  it('is not on the network of a mode it does not touch', () => {
    const state = { ...hubCity(), rails: [] };
    expect(routeFailure(state, state.transitLines![0]!)).not.toBeNull();
    expect(routeFailure(state, state.busLines![0]!)).toBeNull();
  });

  it('is accepted as a stop in saves', () => {
    expect(validateGameState(JSON.parse(JSON.stringify(hubCity())))).not.toBeNull();
  });
});
