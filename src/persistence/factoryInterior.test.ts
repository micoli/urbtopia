import { describe, expect, it } from 'vitest';
import { createBuilding, dispatch, newGame, type Command, type GameState } from '../core';
import { checkGameState } from './validate';

const send = (state: GameState, command: Command): GameState => {
  const result = dispatch(state, command, 0);
  if (!result.ok) throw new Error(result.error.key);
  return result.state;
};

describe('a saved Factory floor', () => {
  const start: GameState = {
    ...newGame({ seed: 'factory-floor', now: 0 }), nextId: 100, urbs: 100_000, tutorial: null, adaptationUntil: 0, lastSeen: 0,
    buildings: [{ ...createBuilding(1, 'factory', 55, 50, 0), tier: 3 }, createBuilding(2, 'arcade', 60, 50, 0)],
  };
  const fitted = [
    { type: 'PlaceFloorFixture', buildingId: 1, fixture: 'factoryMotor', x: 2, y: 2, rotation: 0 },
    { type: 'PlaceFloorFixture', buildingId: 1, fixture: 'factoryShaft', x: 2, y: 3, rotation: 0 },
    { type: 'PlaceFloorFixture', buildingId: 1, fixture: 'factoryPress', x: 2, y: 4, rotation: 2 },
  ] as Command[];
  const withFloor = (floor: unknown, buildingId = 1) => JSON.parse(JSON.stringify({ ...start, buildings: start.buildings.map(b => (b.id === buildingId ? { ...b, floor } : b)) }));

  it('keeps its Fixtures through a save', () => {
    const loaded = JSON.parse(JSON.stringify(fitted.reduce(send, start)));
    const check = checkGameState(loaded);
    expect(check.ok ? 'ok' : check.reason).toBe('ok');
    expect(loaded.buildings[0].floor.fixtures).toHaveLength(3);
  });

  it('loads a Factory saved before the floor existed', () => {
    expect(checkGameState(JSON.parse(JSON.stringify(start))).ok).toBe(true);
  });

  it('refuses a floor on a building that is not a Factory', () => {
    expect(checkGameState(withFloor({ fixtures: [], nextFixtureId: 1 }, 2)).ok).toBe(false);
  });

  it('refuses a Fixture of another kind of room, an unknown one, and one past the next id', () => {
    expect(checkGameState(withFloor({ fixtures: [{ id: 1, type: 'counter', x: 1, y: 1, rotation: 0 }], nextFixtureId: 2 })).ok).toBe(false);
    expect(checkGameState(withFloor({ fixtures: [{ id: 1, type: 'unobtainium', x: 1, y: 1, rotation: 0 }], nextFixtureId: 2 })).ok).toBe(false);
    expect(checkGameState(withFloor({ fixtures: [{ id: 5, type: 'factoryMotor', x: 1, y: 1, rotation: 0 }], nextFixtureId: 2 })).ok).toBe(false);
    expect(checkGameState(withFloor({ fixtures: [{ id: 1, type: 'factoryMotor', x: 1, y: 1, rotation: 0 }], nextFixtureId: 2 })).ok).toBe(true);
  });
});

describe('a saved Packhouse floor', () => {
  const start: GameState = {
    ...newGame({ seed: 'packhouse-floor', now: 0 }), nextId: 100, urbs: 100_000, tutorial: null, adaptationUntil: 0, lastSeen: 0,
    buildings: [{ ...createBuilding(1, 'packhouse', 55, 50, 0), tier: 3 }],
  };
  const withFloor = (floor: unknown) => JSON.parse(JSON.stringify({ ...start, buildings: [{ ...start.buildings[0], floor }] }));

  it('keeps its Fixtures through a save', () => {
    const placed = send(start, { type: 'PlaceFloorFixture', buildingId: 1, fixture: 'packhousePacker', x: 2, y: 0, rotation: 0 });
    const check = checkGameState(JSON.parse(JSON.stringify(placed)));
    expect(check.ok ? 'ok' : check.reason).toBe('ok');
  });

  it('loads a Packhouse saved before the floor existed', () => {
    expect(checkGameState(JSON.parse(JSON.stringify(start))).ok).toBe(true);
  });

  it('refuses a Fixture of a Factory floor', () => {
    expect(checkGameState(withFloor({ fixtures: [{ id: 1, type: 'factoryMotor', x: 1, y: 1, rotation: 0 }], nextFixtureId: 2 })).ok).toBe(false);
    expect(checkGameState(withFloor({ fixtures: [{ id: 1, type: 'packhouseMotor', x: 1, y: 1, rotation: 0 }], nextFixtureId: 2 })).ok).toBe(true);
  });
});

describe('a saved Packhouse with Restockers', () => {
  const start: GameState = {
    ...newGame({ seed: 'restocker-save', now: 0 }), nextId: 100, urbs: 100_000, tutorial: null, adaptationUntil: 0, lastSeen: 0,
    buildings: [{ ...createBuilding(1, 'packhouse', 55, 50, 0), tier: 3 }],
  };
  const exit = { id: 1, type: 'packhouseExitCrate', x: 2, y: 3, rotation: 2, restock: 'wheatCrate', restocker: true, restockedAt: 5 };
  const withFloor = (floor: unknown) => JSON.parse(JSON.stringify({ ...start, buildings: start.buildings.map(b => ({ ...b, floor })) }));

  it('keeps its Restockers, the Restock and the assignment of an Exit', () => {
    const loaded = withFloor({ fixtures: [exit], nextFixtureId: 2, restockers: 1 });
    expect(checkGameState(loaded).ok).toBe(true);
  });

  it('loads a Packhouse saved before the Restockers', () => {
    expect(checkGameState(withFloor({ fixtures: [{ ...exit, restock: undefined, restocker: undefined, restockedAt: undefined }], nextFixtureId: 2 })).ok).toBe(true);
  });

  it('refuses a Restock that is not a Good, a Restocker that is not true, and a Restock on a Fixture that is no Exit', () => {
    expect(checkGameState(withFloor({ fixtures: [{ ...exit, restock: 'unobtainium' }], nextFixtureId: 2, restockers: 1 })).ok).toBe(false);
    expect(checkGameState(withFloor({ fixtures: [{ ...exit, restocker: false }], nextFixtureId: 2, restockers: 1 })).ok).toBe(false);
    expect(checkGameState(withFloor({ fixtures: [{ ...exit, type: 'packhouseConveyor' }], nextFixtureId: 2, restockers: 1 })).ok).toBe(false);
  });

  it('refuses more assigned Exits than hired Restockers', () => {
    expect(checkGameState(withFloor({ fixtures: [exit], nextFixtureId: 2 })).ok).toBe(false);
  });
});
