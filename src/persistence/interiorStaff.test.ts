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
    const homes = [11, 12].map(id => ({ ...createBuilding(id, 'home', 20 + id, 20, 0), tier: 6 }));
    const fitted = [{ type: 'PlaceInteriorFixture', buildingId: 4, fixture: 'millMotor', x: 2, y: 2, rotation: 0 }, { type: 'PlaceInteriorFixture', buildingId: 4, fixture: 'millstone', x: 2, y: 4, rotation: 2 }] as Command[];
    const loaded = JSON.parse(JSON.stringify(fitted.reduce(send, { ...start, buildings: [...start.buildings, ...homes, mill] })));
    expect(valid(loaded)).toBe('ok');
    const saved = loaded.buildings.find((building: { id: number }) => building.id === 4);
    expect(saved.interior.fixtures).toHaveLength(2);
    saved.interior.fixtures[0].type = 'factoryMotor';
    expect(valid(loaded)).not.toBe('ok');
  });

  it('keeps the furniture and the teacher of a School interior, and refuses the furniture of another kind', () => {
    const homes = [11, 12, 13].map(id => ({ ...createBuilding(id, 'home', 20 + id, 20, 0), tier: 6 }));
    const school = { ...createBuilding(5, 'school', 75, 50, 0), tier: 3 };
    const fitted = [{ type: 'PlaceInteriorFixture', buildingId: 5, fixture: 'schoolDesk', x: 1, y: 1, rotation: 0 }, { type: 'PlaceInteriorFixture', buildingId: 5, fixture: 'schoolBlackboard', x: 2, y: 0, rotation: 0 },
      { type: 'HireInteriorStaff', buildingId: 5, role: 'teacher' }] as Command[];
    const loaded = JSON.parse(JSON.stringify(fitted.reduce(send, { ...start, buildings: [...start.buildings, ...homes, school] })));
    expect(valid(loaded)).toBe('ok');
    const saved = loaded.buildings.find((building: { id: number }) => building.id === 5);
    expect(saved.interior.fixtures).toHaveLength(2);
    expect(saved.interior.staff).toEqual({ teacher: 1 });
    saved.interior.fixtures[0].type = 'millstone';
    expect(valid(loaded)).not.toBe('ok');
  });
});
