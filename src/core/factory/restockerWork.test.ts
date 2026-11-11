import { describe, expect, it } from 'vitest';
import { advance, createBuilding, dispatch, newGame, productionTierOf, type Building, type Command, type FixtureId, type GameState, type Rotation, type VenueFixture } from '../index';
import { productionDurationOf } from '../economy/production';

const T0 = 1_700_000_000_000;
const HOUR = 3_600_000;

const put = (id: number, type: FixtureId, x: number, y: number, rotation: Rotation = 0): VenueFixture => ({ id, type, x, y, rotation });

// A Packer on the back wall whose Line goes down to a Crate Exit (fixture 20): Linked.
const crateLine = (exit: Partial<VenueFixture> = { restock: 'wheatCrate', restocker: true }): VenueFixture[] => [
  put(1, 'packhousePacker', 2, 0), put(2, 'packhouseShaft', 3, 0, 1), put(3, 'packhouseMotor', 4, 0, 1),
  put(4, 'packhouseConveyor', 2, 1), put(5, 'packhouseConveyor', 2, 2), { ...put(20, 'packhouseExitCrate', 2, 3, 2), ...exit },
];

const succeed = (state: GameState, command: Command): GameState => {
  const result = dispatch(state, command, state.lastSeen);
  if (!result.ok) throw new Error(result.error.key);
  return result.state;
};

const city = (fixtures: VenueFixture[], wheat = 20, restockers = 1): GameState => {
  const base = newGame({ seed: 'restocker-work', now: T0 });
  const home = { ...createBuilding(base.nextId, 'home', 40, 40, 0), tier: 3 };
  let state: GameState = { ...base, urbs: 100_000, tutorial: null, nextId: base.nextId + 1, buildings: [...base.buildings, home] };
  state = succeed(state, { type: 'PlaceBuilding', buildingType: 'storehouse', x: 56, y: 59 });
  state = succeed(state, { type: 'PlaceBuilding', buildingType: 'packhouse', x: 60, y: 59 });
  const packhouse = state.buildings.find(building => building.type === 'packhouse')!;
  const upgraded: Building = { ...packhouse, tier: 3, slotCount: 4, floor: { fixtures, nextFixtureId: 50, restockers } };
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
