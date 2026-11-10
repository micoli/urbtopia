import { describe, expect, it } from 'vitest';
import { createBuilding } from '../buildings/buildingSpecs';
import { newGame } from '../engine/newGame';
import type { Building, GameState } from '../engine/state';
import { citizenCount } from '../environment/ecology';
import { levelUnlocked } from '../underground/underground';
import { liftBuilding, placeStashedBuilding, stashedBuildings } from './stash';

const T0 = 1_700_000_000_000;

function liftedState(state: GameState, id: number): GameState {
  const outcome = liftBuilding(state, id);
  if (!('state' in outcome)) throw new Error(`expected success, got ${outcome.key}`);
  return outcome.state;
}

function placed(state: GameState, id: number, x: number, y: number, rotation: 0 | 1 | 2 | 3): GameState {
  const outcome = placeStashedBuilding(state, id, x, y, rotation);
  if (!('state' in outcome)) throw new Error(`expected success, got ${outcome.key}`);
  return outcome.state;
}

const withBuildings = (...buildings: Building[]): GameState => {
  const game = newGame({ seed: 'amber-fox-4821', now: T0 });
  return { ...game, buildings: [...game.buildings, ...buildings] };
};

describe('lifting a Building into the Stash', () => {
  it('takes the Building off the map and keeps it whole in the Stash', () => {
    const home = { ...createBuilding(900, 'home', 56, 57, 0), tier: 2, floor: { fixtures: [], nextFixtureId: 3, parquet: 2 } };
    const state = liftedState(withBuildings(home), 900);
    expect(state.buildings.some((building) => building.id === 900)).toBe(false);
    expect(stashedBuildings(state)).toEqual([home]);
  });

  it('refuses a Building that is not on the map', () => {
    expect(liftBuilding(withBuildings(), 12345)).toEqual({ key: 'error.unknownBuilding' });
  });
});

describe('placing a Building of the Stash', () => {
  it('brings a Home with its Home interior back unchanged elsewhere, with no Road', () => {
    const home = { ...createBuilding(900, 'home', 56, 57, 0), tier: 3, floor: { fixtures: [], nextFixtureId: 5, parquet: 1 } };
    const state = placed(liftedState(withBuildings(home), 900), 900, 60, 60, 2);
    expect(state.buildings.find((building) => building.id === 900)).toEqual({ ...home, x: 60, y: 60, rotation: 2 });
    expect(stashedBuildings(state)).toEqual([]);
  });

  it('brings a Venue with its Fixtures and a Factory with its Factory floor back unchanged', () => {
    const supermarket = createBuilding(901, 'supermarket', 56, 57, 0);
    const venue = { ...supermarket, venue: { fixtures: [{ id: 1, type: 'shelfBags' as const, x: 1, y: 1, rotation: 0 as const, stock: 4 }], nextFixtureId: 2, takings: 37 } } as Building;
    const factory = { ...createBuilding(902, 'factory', 52, 52, 0), floor: { fixtures: [], nextFixtureId: 9, rng: 77 } };
    let state = withBuildings(venue, factory);
    state = liftedState(liftedState(state, 901), 902);
    state = placed(placed(state, 901, 64, 64, 1), 902, 70, 64, 3);
    expect(state.buildings.find((building) => building.id === 901)).toEqual({ ...venue, x: 64, y: 64, rotation: 1 });
    expect(state.buildings.find((building) => building.id === 902)).toEqual({ ...factory, x: 70, y: 64, rotation: 3 });
  });

  it('refuses a tile that is taken and land that is not owned', () => {
    const home = createBuilding(900, 'home', 56, 57, 0);
    const other = createBuilding(903, 'home', 60, 60, 0);
    const state = liftedState(withBuildings(home, other), 900);
    expect(placeStashedBuilding(state, 900, 60, 60, 0)).toEqual({ key: 'error.tilesOccupied' });
    expect(placeStashedBuilding(state, 900, 0, 0, 0)).toEqual({ key: 'error.outsideOwnedParcels' });
  });

  it('refuses a Building that is not in the Stash', () => {
    expect(placeStashedBuilding(withBuildings(), 900, 60, 60, 0)).toEqual({ key: 'error.unknownBuilding' });
  });
});

describe('the Citizens during a Replan', () => {
  it('still count the Homes of the Stash, so the Levels stay open and nothing is locked again', () => {
    const home = { ...createBuilding(900, 'home', 56, 57, 0), tier: 8 };
    const city = withBuildings(home);
    const before = citizenCount(city);
    expect(levelUnlocked(city, -1)).toBe(true);
    const lifted = liftedState(city, 900);
    expect(lifted.buildings.some((building) => building.id === 900)).toBe(false);
    expect(citizenCount(lifted)).toBe(before);
    expect(levelUnlocked(lifted, -1)).toBe(true);
    expect(citizenCount(placed(lifted, 900, 60, 60, 0))).toBe(before);
  });
});
