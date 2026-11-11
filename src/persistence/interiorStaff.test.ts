import { describe, expect, it } from 'vitest';
import { createBuilding, dispatch, newGame, type Command, type GameState } from '../core';
import { checkGameState } from './validate';

const send = (state: GameState, command: Command): GameState => {
  const result = dispatch(state, command, 0);
  if (!result.ok) throw new Error(result.error.key);
  return result.state;
};

describe('the Staff of a saved interior', () => {
  const start: GameState = {
    ...newGame({ seed: 'interiors', now: 0 }), nextId: 100, urbs: 100_000, tutorial: null, adaptationUntil: 0, lastSeen: 0,
    buildings: [{ ...createBuilding(1, 'bakery', 55, 50, 0), tier: 3 }, { ...createBuilding(2, 'hospital', 60, 50, 0), tier: 3 }, createBuilding(3, 'arcade', 65, 50, 0)],
  };
  const withInterior = (interior: unknown, buildingId = 1) => JSON.parse(JSON.stringify({ ...start, buildings: start.buildings.map(b => (b.id === buildingId ? { ...b, interior } : b)) }));
  const valid = (state: unknown) => {
    const check = checkGameState(state);
    return check.ok ? 'ok' : check.reason;
  };

  it('keeps its Staff through a save', () => {
    const hired = send(send(start, { type: 'HireInteriorStaff', buildingId: 1, role: 'baker' }), { type: 'HireInteriorStaff', buildingId: 2, role: 'nurse' });
    const loaded = JSON.parse(JSON.stringify(hired));
    expect(valid(loaded)).toBe('ok');
    expect(loaded.buildings[0].interior.staff).toEqual({ baker: 1 });
    expect(loaded.buildings[1].interior.staff).toEqual({ nurse: 1 });
  });

  it('loads a building saved before it had an interior', () => {
    expect(valid(JSON.parse(JSON.stringify(start)))).toBe('ok');
  });

  it('refuses a role the building does not have, a count out of range and an interior on a building without one', () => {
    expect(valid(withInterior({ fixtures: [], nextFixtureId: 1, staff: { teacher: 1 } }))).not.toBe('ok');
    expect(valid(withInterior({ fixtures: [], nextFixtureId: 1, staff: { baker: 21 } }))).not.toBe('ok');
    expect(valid(withInterior({ fixtures: [], nextFixtureId: 1, staff: { baker: 1 } }, 3))).not.toBe('ok');
  });

  it('keeps the Fixtures of a Mill interior, and refuses those of another kind', () => {
    const mill = { ...createBuilding(4, 'mill', 70, 50, 0), tier: 3 };
    const fitted = [{ type: 'PlaceInteriorFixture', buildingId: 4, fixture: 'millMotor', x: 2, y: 2, rotation: 0 }, { type: 'PlaceInteriorFixture', buildingId: 4, fixture: 'millstone', x: 2, y: 4, rotation: 2 }] as Command[];
    const loaded = JSON.parse(JSON.stringify(fitted.reduce(send, { ...start, buildings: [...start.buildings, mill] })));
    expect(valid(loaded)).toBe('ok');
    expect(loaded.buildings[3].interior.fixtures).toHaveLength(2);
    loaded.buildings[3].interior.fixtures[0].type = 'factoryMotor';
    expect(valid(loaded)).not.toBe('ok');
  });
});
