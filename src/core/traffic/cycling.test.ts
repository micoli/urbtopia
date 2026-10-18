import { afterEach, describe, expect, it } from 'vitest';
import { citizensOf, congestionStats, createBuilding, newGame, type Building, type GameState } from '../index';
import { WALKING, modeShares } from './walking';

const base = newGame({ seed: 'walking', now: 0 });
const defaults = { work: WALKING.workThreshold, shop: WALKING.thresholds.shop, factor: WALKING.cyclingFactor };

function withHome(state: GameState, x: number, y: number, tier: number): GameState {
  const home: Building = { ...createBuilding(state.nextId, 'home', x, y, 0), tier };
  return { ...state, roads: [...state.roads], nextId: state.nextId + 1, buildings: [...state.buildings, home] };
}

const homeIdOf = (state: GameState): number => state.buildings.filter((building) => building.type === 'home').at(-1)!.id;

afterEach(() => {
  WALKING.workThreshold = defaults.work;
  WALKING.thresholds.shop = defaults.shop;
  WALKING.cyclingFactor = defaults.factor;
});

describe('cycling commute', () => {
  it('cycles to a workplace out of walking range but within three times it, off the road', () => {
    WALKING.workThreshold = 3;
    const state = withHome(base, 56, 59, 1);
    const stats = congestionStats(state);
    const home = stats.homes.get(homeIdOf(state))!;
    expect(home.walkers).toBe(0);
    expect(home.cyclists).toBe(citizensOf(1));
    expect(home.commuters).toBe(0);
    expect(stats.cyclists).toBe(citizensOf(1));
    expect(stats.modes.cycling).toBe(citizensOf(1));
  });

  it('drives beyond cycling range', () => {
    WALKING.workThreshold = 3;
    WALKING.cyclingFactor = 1;
    const state = withHome(base, 56, 59, 1);
    const home = congestionStats(state).homes.get(homeIdOf(state))!;
    expect(home.cyclists).toBe(0);
    expect(home.commuters).toBe(citizensOf(1));
  });

  it('walks rather than cycles when the workplace is within walking range', () => {
    const state = withHome(base, 56, 59, 1);
    const home = congestionStats(state).homes.get(homeIdOf(state))!;
    expect(home.walkers).toBe(citizensOf(1));
    expect(home.cyclists).toBe(0);
  });

  it('counts every Citizen in exactly one mode and shares sum to one', () => {
    WALKING.workThreshold = 7;
    const state = withHome(base, 56, 59, 3);
    const stats = congestionStats(state);
    const home = stats.homes.get(homeIdOf(state))!;
    expect(home.walkers + home.cyclists + home.commuters + home.unemployed).toBe(citizensOf(3));
    const shares = modeShares(stats);
    expect(shares.car + shares.transit + shares.walking + shares.cycling).toBeCloseTo(1);
  });
});

describe('cycling trips to services', () => {
  const city = () => {
    const start = newGame({ seed: 'walking-trips', now: 0 });
    const added: Building[] = [{ ...createBuilding(start.nextId, 'shop', 57, 57, 0), tier: 1 }, { ...createBuilding(start.nextId + 1, 'home', 56, 59, 0), tier: 1 }];
    return { ...start, roads: [...start.roads], nextId: start.nextId + 2, buildings: [...start.buildings, ...added] };
  };

  it('cycles to a shop out of walking range but within three times it', () => {
    WALKING.thresholds.shop = 3;
    const stats = congestionStats(city());
    expect(stats.walkingTrips.shop).toBe(0);
    expect(stats.cyclingTrips.shop).toBe(citizensOf(1) * WALKING.tripsPerCitizen.shop);
  });

  it('walks, and does not also cycle, to a shop within walking range', () => {
    const stats = congestionStats(city());
    expect(stats.walkingTrips.shop).toBe(citizensOf(1) * WALKING.tripsPerCitizen.shop);
    expect(stats.cyclingTrips.shop).toBe(0);
  });

  it('skips a shop beyond cycling range', () => {
    WALKING.thresholds.shop = 2;
    const stats = congestionStats(city());
    expect(stats.walkingTrips.shop + stats.cyclingTrips.shop).toBe(0);
  });

  it('counts cycling trips in the walk access of the Home', () => {
    WALKING.thresholds.shop = 3;
    const state = city();
    expect(congestionStats(state).homes.get(state.buildings.at(-1)!.id)!.walkAccess).toBeGreaterThan(0);
  });
});
