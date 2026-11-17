import { describe, expect, it } from 'vitest';
import { createBuilding, dispatch, interiorBonusOfBuilding, interiorLinksOf, interiorSizeOf, newGame, storageCapacity, type Building, type Command, type FixtureId, type GameState, type Rotation } from '../index';

// A city with enough Citizens for every interior to be fitted out.
const homes = [10, 11, 12, 13].map(id => ({ ...createBuilding(id, 'home', 40 + id, 30, 0), tier: 6 }));

const city = (tier = 5, urbs = 100_000): GameState => ({
  ...newGame({ seed: 'storehouse-interior', now: 0 }),
  nextId: 100,
  urbs,
  tutorial: null,
  buildings: [...homes, { ...createBuilding(1, 'storehouse', 55, 50, 0), tier }],
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
const storehouse = (state: GameState): Building => state.buildings.find(candidate => candidate.id === 1)!;
const place = (fixture: FixtureId, x: number, y: number, rotation: Rotation = 0): Command => ({ type: 'PlaceInteriorFixture', buildingId: 1, fixture, x, y, rotation });
const apply = (state: GameState, ...commands: Command[]) => commands.reduce(send, state);
const stocker: Command = { type: 'HireInteriorStaff', buildingId: 1, role: 'stocker' };

// A Loading dock against the back wall at (4, 0) and a Hoist at (4, 2) take their Drive on the right; the Line ends in a Rack on the front edge of the room.
const line = [place('storehouseDock', 4, 0), place('storehouseShaft', 5, 0, 1), place('storehouseMotor', 6, 0, 1), place('storehouseConveyor', 4, 1), place('storehouseHoist', 4, 2),
  place('storehouseShaft', 5, 2, 1), place('storehouseMotor', 6, 2, 1), place('storehouseConveyor', 4, 3), place('storehouseConveyor', 4, 4), place('storehouseConveyor', 4, 5),
  place('storehouseConveyor', 4, 6), place('storehouseRack', 4, 7, 2)];

describe('the Storehouse interior', () => {
  const withLine = apply(city(), ...line);

  it('is a Line interior of its own kind, with a room that grows with the Tier', () => {
    expect(interiorSizeOf(storehouse(city(1)))).toBe(6);
    expect(interiorSizeOf(storehouse(city(10)))).toBe(10);
    expect(failure(city(), place('millstone', 2, 2))).toBe('error.unknownCommand');
  });

  it('links its Line from the dock to the Rack once both Machines have their Drive', () => {
    const { fixtures } = storehouse(withLine).interior!;
    expect(interiorLinksOf(fixtures).lined.has(fixtures.find(fixture => fixture.type === 'storehouseRack')!.id)).toBe(true);
  });

  it('holds more only with a stocker, and as much as before without', () => {
    const base = storageCapacity(city());
    expect(storageCapacity(withLine)).toEqual(base);
    const hired = apply(withLine, stocker);
    expect(interiorBonusOfBuilding(storehouse(hired)).capacity).toBeGreaterThan(0);
    const capacity = storageCapacity(hired);
    expect(capacity.goods).toBeGreaterThan(base.goods);
    expect(capacity.materials).toBeGreaterThan(base.materials);
  });

  it('adds its room on top of what the production queues need', () => {
    const producing = (state: GameState): GameState => ({ ...state, buildings: [...state.buildings, ...[2, 3, 4, 5, 6, 7, 8, 9, 14].map(id => ({ ...createBuilding(id, 'factory', 30 + id * 3, 40, 0), tier: 4, slotCount: 8 }))] });
    expect(storageCapacity(producing(city())).goods).toBeGreaterThan(storageCapacity(city()).goods);
    const base = storageCapacity(producing(city()));
    const hired = storageCapacity(producing(apply(city(), ...line, stocker)));
    expect(hired.goods).toBeGreaterThan(base.goods);
    expect(hired.materials).toBeGreaterThan(base.materials);
  });

  it('adds its room with the Staff hired, whether or not Citizens fill the posts', () => {
    const hired = apply(withLine, stocker);
    const grown = storageCapacity(hired);
    const afterAdaptation = { ...hired, lastSeen: 10 * 24 * 3_600_000 };
    expect(storageCapacity(afterAdaptation)).toEqual(grown);
    expect(grown.goods).toBeGreaterThan(storageCapacity(city()).goods);
  });

  it('holds no more when the Line is cut', () => {
    const cut = { ...withLine, buildings: withLine.buildings.map(building => (building.id !== 1 ? building : { ...building, interior: { ...building.interior!, fixtures: building.interior!.fixtures.filter(fixture => fixture.type !== 'storehouseConveyor') } })) };
    expect(storageCapacity(apply(cut, stocker))).toEqual(storageCapacity(city()));
  });
});

describe.each([
  { type: 'vault', gains: 'goods', unchanged: 'materials' },
  { type: 'materialDepot', gains: 'materials', unchanged: 'goods' },
] as const)('the $type interior, which runs the Storehouse interior', ({ type, gains, unchanged }) => {
  const storage = (tier = 5): GameState => ({ ...city(), buildings: [...homes, { ...createBuilding(1, type, 55, 50, 0), tier }] });
  const withLine = apply(storage(), ...line);

  it('takes the Fixtures of the Storehouse and a room that grows with its Tier', () => {
    expect(failure(storage(), place('millstone', 2, 2))).toBe('error.unknownCommand');
    expect(interiorSizeOf(withLine.buildings.find(candidate => candidate.id === 1)!)).toBe(8);
  });

  it('holds more only in its own compartment, and only with a stocker', () => {
    const base = storageCapacity(storage());
    expect(storageCapacity(withLine)).toEqual(base);
    const hired = storageCapacity(apply(withLine, stocker));
    expect(hired[gains]).toBeGreaterThan(base[gains]);
    expect(hired[unchanged]).toBe(base[unchanged]);
  });
});
