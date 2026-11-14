import { describe, expect, it } from 'vitest';
import { createBuilding, dispatch, newGame, type Building, type Command, type FixtureId, type GameState, type Rotation } from '../index';
import { fixtureRefund } from '../venues/venues';
import { FIXTURES } from '../venues/fixtures';
import { interiorBonusOf, interiorGridSizeOf } from './factoryInterior';

const city = (tier = 1, urbs = 100_000): GameState => ({
  ...newGame({ seed: 'factory-floor', now: 0 }),
  nextId: 100,
  urbs,
  tutorial: null,
  buildings: [{ ...createBuilding(1, 'factory', 55, 50, 0), tier }, createBuilding(2, 'arcade', 60, 50, 0)],
});
const send = (state: GameState, command: Command): GameState => {
  const result = dispatch(state, command, 0);
  if (!result.ok) throw new Error(result.error.key);
  return result.state;
};
const failure = (state: GameState, command: Command) => {
  const result = dispatch(state, command, 0);
  return result.ok ? null : result.error.key;
};
const factory = (state: GameState): Building => state.buildings.find(candidate => candidate.id === 1)!;
const place = (fixture: FixtureId, x: number, y: number, rotation: Rotation = 0, buildingId = 1): Command => ({ type: 'PlaceInteriorFixture', buildingId, fixture, x, y, rotation });

describe('placing a Fixture on a Factory interior', () => {
  it('starts with no floor and puts the Fixture on a new one', () => {
    expect(factory(city()).interior).toBeUndefined();
    const state = send(city(), place('factoryMotor', 2, 2));
    expect(factory(state).interior?.fixtures).toEqual([{ id: 1, type: 'factoryMotor', x: 2, y: 2, rotation: 0 }]);
    expect(factory(state).interior?.nextFixtureId).toBe(2);
    expect(state.urbs).toBe(100_000 - FIXTURES.factoryMotor.price);
  });

  it('keeps the Factory production untouched', () => {
    const before = factory(city());
    const after = factory(send(city(), place('factoryMotor', 2, 2)));
    expect({ ...after, interior: undefined }).toEqual({ ...before, interior: undefined });
  });

  it('refuses a building that is not a Factory', () => {
    expect(failure(city(), place('factoryMotor', 2, 2, 0, 2))).toBe('error.unknownBuilding');
    expect(failure(city(), place('factoryMotor', 2, 2, 0, 99))).toBe('error.unknownBuilding');
  });

  it('refuses a Fixture of another kind of room', () => {
    expect(failure(city(), place('counter', 2, 2))).toBe('error.unknownCommand');
  });

  it('refuses a Fixture the Tier of the Factory does not allow yet', () => {
    expect(failure(city(1), place('factoryMixingVat', 2, 2))).toBe('error.tierTooLow');
    expect(failure(city(2), place('factoryMixingVat', 2, 2))).toBeNull();
  });

  it('refuses a place outside the grid, an occupied place and the entrance', () => {
    const size = interiorGridSizeOf(1);
    expect(failure(city(), place('factoryMotor', size, 2))).toBe('error.tilesOccupied');
    expect(failure(city(), place('factoryMotor', -1, 2))).toBe('error.tilesOccupied');
    expect(failure(city(), place('factoryMotor', 3, 0))).toBe('error.tilesOccupied');
    const state = send(city(), place('factoryMotor', 2, 2));
    expect(failure(state, place('factoryGear', 2, 2))).toBe('error.tilesOccupied');
  });

  it('refuses a Fixture the city cannot pay for', () => {
    expect(failure(city(1, FIXTURES.factoryMotor.price - 1), place('factoryMotor', 2, 2))).toBe('error.notEnoughUrbs');
  });

  it('grows the grid with the Tier', () => {
    expect(interiorGridSizeOf(5)).toBeGreaterThan(interiorGridSizeOf(1));
    expect(failure(city(5), place('factoryMotor', interiorGridSizeOf(1), 2))).toBeNull();
  });
});

describe('moving and removing a Fixture of a Factory interior', () => {
  const withMotor = () => send(city(), place('factoryMotor', 2, 2));

  it('turns and moves a Fixture for free', () => {
    const state = send(withMotor(), { type: 'MoveInteriorFixture', buildingId: 1, fixtureId: 1, x: 4, y: 3, rotation: 2 });
    expect(factory(state).interior?.fixtures[0]).toMatchObject({ x: 4, y: 3, rotation: 2 });
    expect(state.urbs).toBe(withMotor().urbs);
  });

  it('refuses to move a Fixture onto another or out of the grid', () => {
    const state = send(withMotor(), place('factoryGear', 3, 2));
    expect(failure(state, { type: 'MoveInteriorFixture', buildingId: 1, fixtureId: 1, x: 3, y: 2 })).toBe('error.tilesOccupied');
    expect(failure(state, { type: 'MoveInteriorFixture', buildingId: 1, fixtureId: 1, x: 99, y: 2 })).toBe('error.tilesOccupied');
    expect(failure(state, { type: 'MoveInteriorFixture', buildingId: 1, fixtureId: 42, x: 3, y: 3 })).toBe('error.unknownFixture');
  });

  it('removes a Fixture and refunds part of its price', () => {
    const before = withMotor();
    const state = send(before, { type: 'RemoveInteriorFixture', buildingId: 1, fixtureId: 1 });
    expect(factory(state).interior?.fixtures).toEqual([]);
    expect(state.urbs).toBe(before.urbs + fixtureRefund('factoryMotor'));
    expect(failure(state, { type: 'RemoveInteriorFixture', buildingId: 1, fixtureId: 1 })).toBe('error.unknownFixture');
  });
});

describe('what a Factory interior adds', () => {
  it('links a Press fed by a Motor through a Shaft and adds its speed', () => {
    let state = city(5);
    for (const command of [place('factoryMotor', 2, 2), place('factoryShaft', 2, 3), place('factoryPress', 2, 4, 2)]) state = send(state, command);
    expect(interiorBonusOf(factory(state).interior!.fixtures, factory(state).tier)).toMatchObject({ speed: FIXTURES.factoryPress.speed, yield: 0 });
  });
});
