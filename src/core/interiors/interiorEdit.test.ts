import { describe, expect, it } from 'vitest';
import { createBuilding, newGame, type Building, type GameState } from '../index';
import type { InteriorData } from '../engine/state';
import { editInterior } from './interiorEdit';

const city = (urbs = 100): GameState => ({
  ...newGame({ seed: 'edit', now: 0 }),
  nextId: 100,
  urbs,
  tutorial: null,
  buildings: [createBuilding(1, 'factory', 55, 50, 0), createBuilding(2, 'arcade', 60, 50, 0)],
});

const anyBuilding = (): boolean => true;
const noBuilding = (): boolean => false;
const withNextId = (interior: InteriorData): InteriorData => ({ ...interior, nextFixtureId: interior.nextFixtureId + 1 });

const stateOf = (outcome: ReturnType<typeof editInterior>): GameState => {
  if (!('state' in outcome)) throw new Error(outcome.key);
  return outcome.state;
};

describe('editing the interior of a building', () => {
  it('refuses a building that does not exist, and one the gate refuses', () => {
    expect(editInterior(city(), 99, anyBuilding, (_building, interior) => ({ interior }))).toEqual({ key: 'error.unknownBuilding' });
    expect(editInterior(city(), 1, noBuilding, (_building, interior) => ({ interior }))).toEqual({ key: 'error.unknownBuilding' });
  });

  it('hands the change an empty interior when the building has none', () => {
    let received: InteriorData | undefined;
    editInterior(city(), 1, anyBuilding, (_building, interior) => {
      received = interior;
      return { interior };
    });
    expect(received).toEqual({ fixtures: [], nextFixtureId: 1 });
  });

  it('passes an error of the change through, even when the city could not pay', () => {
    expect(editInterior(city(0), 1, anyBuilding, () => ({ key: 'error.tierTooLow' }))).toEqual({ key: 'error.tierTooLow' });
  });

  it('refuses a change that costs more Urbs than the city has', () => {
    expect(editInterior(city(10), 1, anyBuilding, (_building, interior) => ({ interior, urbs: -20 }))).toEqual({ key: 'error.notEnoughUrbs' });
  });

  it('replaces the interior of that building only, and applies the Urbs of the change', () => {
    const before = city(100);
    const state = stateOf(editInterior(before, 1, anyBuilding, (_building, interior) => ({ interior: withNextId(interior), urbs: -30 })));
    expect(state.urbs).toBe(70);
    expect(state.buildings.find(building => building.id === 1)?.interior?.nextFixtureId).toBe(2);
    expect(state.buildings.find(building => building.id === 2)).toBe(before.buildings.find(building => building.id === 2));
  });

  it('adds a refund to the Urbs', () => {
    const state = stateOf(editInterior(city(100), 1, anyBuilding, (_building, interior) => ({ interior, urbs: 25 })));
    expect(state.urbs).toBe(125);
  });

  it('leaves the Urbs as they are when the change gives none', () => {
    const state = stateOf(editInterior(city(100), 1, anyBuilding, (_building, interior) => ({ interior })));
    expect(state.urbs).toBe(100);
  });

  it('gives the change the building it edits', () => {
    let seen: Building | undefined;
    editInterior(city(), 1, anyBuilding, (building, interior) => {
      seen = building;
      return { interior };
    });
    expect(seen?.type).toBe('factory');
  });
});
