import { describe, expect, it } from 'vitest';
import { advance, dispatch, newGame, type Building, type Command, type FixtureId, type GameState, type GoodId, type Rotation, type VenueFixture } from '../index';

const T0 = 1_700_000_000_000;

const put = (id: number, type: FixtureId, x: number, y: number, rotation: Rotation = 0): VenueFixture => ({ id, type, x, y, rotation });

const succeed = (state: GameState, command: Command): GameState => {
  const result = dispatch(state, command, state.lastSeen);
  if (!result.ok) throw new Error(result.error.key);
  return result.state;
};

const factoryOf = (state: GameState): Building => state.buildings.find(building => building.type === 'factory')!;

// A Motor drives a Press through a Shaft: the Press runs (fixture 3).
const floor = (press: Partial<VenueFixture> = {}): VenueFixture[] => [put(1, 'factoryMotor', 3, 3), put(2, 'factoryShaft', 3, 4), { ...put(3, 'factoryPress', 3, 5, 2), ...press }];

const city = (fixtures: VenueFixture[], restockers = 1): GameState => {
  const base = newGame({ seed: 'factory-restocker', now: T0 });
  let state: GameState = { ...base, urbs: 100_000, tutorial: null };
  state = succeed(state, { type: 'PlaceBuilding', buildingType: 'storehouse', x: 56, y: 59 });
  state = succeed(state, { type: 'PlaceBuilding', buildingType: 'factory', x: 60, y: 59 });
  const factory = factoryOf(state);
  const upgraded: Building = { ...factory, tier: 3, slotCount: 4, interior: { fixtures, nextFixtureId: 50, restockers } };
  return { ...state, storage: { materials: { wood: 50 }, goods: {} }, buildings: state.buildings.map(building => (building === factory ? upgraded : building)) };
};

const good = 'planks' as GoodId;

describe('a Restocker at work on a Machine of a Factory', () => {
  it('lets the player pick any Good of the Factory on a Machine and assign a Restocker', () => {
    let state = city(floor());
    state = succeed(state, { type: 'SetExitRestock', buildingId: factoryOf(state).id, fixtureId: 3, good });
    state = succeed(state, { type: 'AssignInteriorRestocker', buildingId: factoryOf(state).id, fixtureId: 3 });
    expect(factoryOf(state).interior!.fixtures.find(fixture => fixture.id === 3)).toMatchObject({ restock: good, restocker: true });
  });

  it('refuses a Restock on a Fixture that is not a Machine', () => {
    const state = city(floor());
    const result = dispatch(state, { type: 'SetExitRestock', buildingId: factoryOf(state).id, fixtureId: 2, good }, state.lastSeen);
    expect(result.ok).toBe(false);
  });

  it('refuses a Restock on a Boiler, which only heats', () => {
    const state = city([...floor(), put(4, 'factoryBoiler', 5, 5)]);
    const result = dispatch(state, { type: 'SetExitRestock', buildingId: factoryOf(state).id, fixtureId: 4, good }, state.lastSeen);
    expect(result.ok).toBe(false);
  });

  it('hires a Restocker in a Factory', () => {
    const state = city(floor(), 0);
    const hired = succeed(state, { type: 'HireInteriorRestocker', buildingId: factoryOf(state).id });
    expect(factoryOf(hired).interior!.restockers).toBe(1);
  });

  it('starts the production of its Restock when the Machine runs', () => {
    const after = advance(city(floor({ restock: good, restocker: true })), T0 + 1_000).state;
    expect(factoryOf(after).queue.some(entry => entry.exitId === 3 && entry.item === good)).toBe(true);
  });

  it('does nothing when the Machine has no Drive', () => {
    const fixtures = floor({ restock: good, restocker: true }).filter(fixture => fixture.id !== 2);
    const after = advance(city(fixtures), T0 + 1_000).state;
    expect(factoryOf(after).queue).toHaveLength(0);
  });

  it('does nothing without a Restocker assigned', () => {
    const after = advance(city(floor({ restock: good })), T0 + 1_000).state;
    expect(factoryOf(after).queue).toHaveLength(0);
  });
});
