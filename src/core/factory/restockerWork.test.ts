import { describe, expect, it } from 'vitest';
import { advance, createBuilding, dispatch, newGame, type Building, type Command, type FixtureId, type GameState, type Rotation, type VenueFixture } from '../index';
import { productionDurationOf } from '../economy/production';
import { storageCapacity } from '../economy/storage';

const T0 = 1_700_000_000_000;
const HOUR = 3_600_000;

const put = (id: number, type: FixtureId, x: number, y: number, rotation: Rotation = 0): VenueFixture => ({ id, type, x, y, rotation });

// A Packer on the back wall whose Line goes down to a Crate Exit (fixture 20): Linked.
const crateLine = (exit: Partial<VenueFixture> = { restock: 'wheatCrate', restocker: true }): VenueFixture[] => [
  put(1, 'packhousePacker', 2, 0), put(2, 'packhouseShaft', 3, 0, 1), put(3, 'packhouseMotor', 4, 0, 1),
  put(4, 'packhouseConveyor', 2, 1), put(5, 'packhouseConveyor', 2, 2), { ...put(20, 'packhouseExitCrate', 2, 3, 2), ...exit },
];

// A second Line, to a second Crate Exit (fixture 21).
const secondLine = (exit: Partial<VenueFixture> = { restock: 'wheatCrate', restocker: true }): VenueFixture[] => [
  put(11, 'packhousePacker', 5, 0), put(12, 'packhouseShaft', 6, 0, 1), put(13, 'packhouseMotor', 7, 0, 1),
  put(14, 'packhouseConveyor', 5, 1), put(15, 'packhouseConveyor', 5, 2), { ...put(21, 'packhouseExitCrate', 5, 3, 2), ...exit },
];

const succeed = (state: GameState, command: Command): GameState => {
  const result = dispatch(state, command, state.lastSeen);
  if (!result.ok) throw new Error(result.error.key);
  return result.state;
};

const city = (fixtures: VenueFixture[], wheat = 20, restockers = 1, slotCount = 4): GameState => {
  const base = newGame({ seed: 'restocker-work', now: T0 });
  const home = { ...createBuilding(base.nextId, 'home', 40, 40, 0), tier: 3 };
  let state: GameState = { ...base, urbs: 100_000, tutorial: null, nextId: base.nextId + 1, buildings: [...base.buildings, home] };
  state = succeed(state, { type: 'PlaceBuilding', buildingType: 'storehouse', x: 56, y: 59 });
  state = succeed(state, { type: 'PlaceBuilding', buildingType: 'packhouse', x: 60, y: 59 });
  const packhouse = state.buildings.find(building => building.type === 'packhouse')!;
  const upgraded: Building = { ...packhouse, tier: 3, slotCount, floor: { fixtures, nextFixtureId: 50, restockers } };
  return { ...state, storage: { materials: { wheat }, goods: {} }, buildings: state.buildings.map(building => (building === packhouse ? upgraded : building)) };
};
const packhouseOf = (state: GameState): Building => state.buildings.find(building => building.type === 'packhouse')!;
const crates = (state: GameState): number => state.storage.goods.wheatCrate ?? 0;
const wheat = (state: GameState): number => state.storage.materials.wheat ?? 0;
const cycleMs = (state: GameState): number => productionDurationOf(packhouseOf(state), 'wheatCrate');

describe('a Restocker at work on a Linked Exit', () => {
  it('starts the production of its Restock, taking the ingredients from the Storehouse', () => {
    const state = city(crateLine());
    const after = advance(state, T0 + 1_000).state;
    expect(packhouseOf(after).queue).toHaveLength(1);
    expect(packhouseOf(after).queue[0]).toMatchObject({ item: 'wheatCrate', done: false });
    expect(wheat(after)).toBe(18);
  });

  it('stores what is finished and starts the next production at the moment the last one ended', () => {
    const state = city(crateLine());
    const started = advance(state, T0 + 1_000).state;
    const after = advance(started, T0 + 1_000 + cycleMs(started) + 1_000).state;
    expect(crates(after)).toBeGreaterThan(0);
    expect(packhouseOf(after).queue.filter(entry => entry.done)).toHaveLength(0);
    expect(packhouseOf(after).queue).toHaveLength(1);
    expect(wheat(after)).toBe(16);
  });

  it('keeps going through a long absence, one production after the other', () => {
    const state = city(crateLine(), 200);
    const completed = Math.floor((HOUR / 6) / cycleMs(state));
    const after = advance(state, T0 + HOUR / 6).state;
    expect(completed).toBeGreaterThan(10);
    expect(wheat(after)).toBe(200 - 2 * (completed + 1));
    expect(crates(after)).toBeGreaterThanOrEqual(completed);
    expect(packhouseOf(after).queue).toHaveLength(1);
  });
});

describe('a Line with no one at work', () => {
  it('leaves the queue alone without a Restocker, without a Restock or on a broken Line', () => {
    for (const exit of [{ restock: 'wheatCrate' as const }, { restocker: true as const }]) {
      expect(packhouseOf(advance(city(crateLine(exit)), T0 + HOUR).state).queue).toHaveLength(0);
    }
    const broken = crateLine().map(fixture => (fixture.id === 5 ? { ...fixture, broken: true as const } : fixture));
    expect(packhouseOf(advance(city(broken), T0 + HOUR).state).queue).toHaveLength(0);
  });
});

describe('Restockers sharing the Slots of a Packhouse', () => {
  const owners = (state: GameState): (number | undefined)[] => packhouseOf(state).queue.map(entry => entry.exitId);

  it('never takes the last free Slot, which stays for the player', () => {
    const state = city([...crateLine(), ...secondLine()], 20, 2, 2);
    expect(owners(advance(state, T0 + 1_000).state)).toHaveLength(1);
    expect(owners(advance(city([...crateLine(), ...secondLine()], 20, 2, 3), T0 + 1_000).state)).toEqual([20, 21]);
  });

  it('serves the Exit that restarted the longest ago, so that the Lines take turns', () => {
    let state = city([...crateLine(), ...secondLine()], 40, 2, 2);
    const seen: (number | undefined)[] = [];
    let now = T0 + 1_000;
    for (let turn = 0; turn < 4; turn++) {
      state = advance(state, now).state;
      seen.push(...owners(state));
      now += cycleMs(state) + 1_000;
    }
    expect(seen).toEqual([20, 21, 20, 21]);
  });
});

describe('a Restocker held back', () => {
  it('waits for the ingredients and starts again by itself when they are back', () => {
    const lacking = advance(city(crateLine(), 2), T0 + 3 * cycleMs(city(crateLine()))).state;
    expect(wheat(lacking)).toBe(0);
    expect(packhouseOf(lacking).queue).toHaveLength(0);
    expect(crates(lacking)).toBeGreaterThan(0);
    const supplied = { ...lacking, storage: { ...lacking.storage, materials: { wheat: 10 } } };
    expect(packhouseOf(advance(supplied, lacking.lastSeen + 1_000).state).queue).toHaveLength(1);
  });

  it('keeps a finished production when the Storehouse is full, and stores it once there is room', () => {
    const state = city(crateLine(), 20);
    const capacity = storageCapacity(state).goods;
    const full = { ...state, storage: { ...state.storage, goods: { honeyCrate: capacity } } };
    const blocked = advance(full, T0 + 2 * cycleMs(state)).state;
    expect(packhouseOf(blocked).queue).toHaveLength(1);
    expect(packhouseOf(blocked).queue[0]).toMatchObject({ done: true });
    expect(wheat(blocked)).toBe(18);
    const room = { ...blocked, storage: { ...blocked.storage, goods: {} } };
    const resumed = advance(room, blocked.lastSeen + 1_000).state;
    expect(crates(resumed)).toBeGreaterThan(0);
    expect(packhouseOf(resumed).queue[0]).toMatchObject({ done: false });
  });
});

describe('the wage of a Restocker', () => {
  it('is paid by the hour, whatever the Restocker does', () => {
    const idle = crateLine({});
    const paid = advance(city(crateLine()), T0 + HOUR).state.urbs;
    const unpaid = advance(city(idle, 20, 0), T0 + HOUR).state.urbs;
    expect(unpaid - paid).toBeCloseTo(28 / 24, 5);
  });

  it('is not worked for when the city has no Urbs left to pay it', () => {
    const broke = { ...city(crateLine()), urbs: 0 };
    expect(packhouseOf(advance(broke, T0 + 1_000).state).queue).toHaveLength(0);
  });

  it('is worked for only by as many Exits as Restockers are hired', () => {
    const state = city([...crateLine(), ...secondLine()], 20, 1, 4);
    expect(packhouseOf(advance(state, T0 + 1_000).state).queue.map(entry => entry.exitId)).toEqual([20]);
  });
});
