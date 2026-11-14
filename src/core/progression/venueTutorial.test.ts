import { describe, expect, it } from 'vitest';
import { createBuilding, dispatch, newGame, type Building, type Command, type GameState, type StaffRole } from '../index';
import { canReplayVenueTutorial, isVenueStepDone } from './venueTutorial';

const venueBuilding = (id: number, type: 'arcade' | 'supermarket', extra: Partial<Building['venue'] & object> = {}): Building => {
  const building = createBuilding(id, type, 55 + id * 6, 50, 0);
  return { ...building, venue: { ...building.venue!, ...extra } };
};
const city = (buildings: Building[] = [], extra: Partial<GameState> = {}): GameState => ({
  ...newGame({ seed: 'venue-tutorial', now: 0 }), urbs: 10_000, nextId: 100, tutorial: null, adaptationUntil: 0, buildings, ...extra,
});
const send = (state: GameState, command: Command, now = 0) => {
  const result = dispatch(state, command, now);
  if (!result.ok) throw new Error(result.error.key);
  return result.state;
};
const hire = (state: GameState, role: StaffRole): GameState => ({
  ...state,
  buildings: state.buildings.map(b => (b.venue ? { ...b, venue: { ...b.venue, staff: { ...b.venue.staff, [role]: 1 } } } : b)),
});
const road = (state: GameState): GameState => ({ ...state, roads: Array.from({ length: 30 }, (_, index) => ({ x: 50 + index, y: 49, kind: 'road' as const })) });

describe('Venue tutorial start', () => {
  it('starts at the first step not done when the first Arcade exists', () => {
    const state = send(city([venueBuilding(1, 'arcade')]), { type: 'SkipTutorial' });
    expect(state.venueTutorials).toEqual({ arcade: 'fixture' });
  });

  it('starts when the first Arcade is placed, and a second one changes nothing', () => {
    const placed = send(road(city([10, 11, 12].map(id => ({ ...createBuilding(id, 'home', 40, id * 3, 0), tier: 8 })))), { type: 'PlaceBuilding', buildingType: 'arcade', x: 55, y: 50 });
    expect(placed.venueTutorials?.arcade).toBe('fixture');
    const finished = { ...placed, venueTutorials: { arcade: null } };
    const second = send(finished, { type: 'PlaceBuilding', buildingType: 'arcade', x: 66, y: 50 });
    expect(second.venueTutorials).toEqual({ arcade: null });
  });

  it('does not start while the initial Tutorial is active', () => {
    const state = send(city([venueBuilding(1, 'arcade')], { tutorial: 'road' }), { type: 'BuildRoad', from: { x: 50, y: 48 }, to: { x: 52, y: 48 } }).venueTutorials;
    expect(state).toBeUndefined();
  });

  it('creates no guided entry for a game started with the bypass', () => {
    const state = newGame({ seed: 'bypass', now: 0, venueTutorials: false });
    expect(state.venueTutorials).toEqual({ arcade: null, supermarket: null });
  });
});

describe('Arcade steps', () => {
  it('advances through fixture, employee and collection', () => {
    let state = send(city([venueBuilding(1, 'arcade')], { venueTutorials: { arcade: 'fixture' } }), { type: 'PlaceFixture', buildingId: 1, fixture: 'barrelClimber', x: 2, y: 3 });
    expect(state.venueTutorials?.arcade).toBe('employee');
    state = send(hire(state, 'employee'), { type: 'SetDifficulty', difficulty: 'medium' });
    expect(state.venueTutorials?.arcade).toBe('collect');
  });

  it('counts Takings collected, not accrued', () => {
    const state = city([venueBuilding(1, 'arcade', { takings: 5 })], { venueTutorials: { arcade: 'collect' } });
    expect(isVenueStepDone(state, 'arcade', 'collect')).toBe(false);
    const collected = send(state, { type: 'Collect', buildingId: 1 });
    expect(collected.buildings[0]!.venue!.collected).toBe(5);
    expect(collected.venueTutorials?.arcade).toBeNull();
  });

  it('does not lock any command', () => {
    const state = city([venueBuilding(1, 'arcade')], { venueTutorials: { arcade: 'fixture' } });
    expect(send(state, { type: 'BuildRoad', from: { x: 50, y: 48 }, to: { x: 52, y: 48 } }).roads.length).toBeGreaterThan(0);
  });
});

describe('Supermarket steps', () => {
  const supermarket = (fixtures: NonNullable<Building['venue']>['fixtures'], nextFixtureId = fixtures.length + 1, staff: Partial<Record<StaffRole, number>> = {}) =>
    city([venueBuilding(1, 'supermarket', { fixtures, nextFixtureId, staff })], { venueTutorials: { supermarket: 'checkout' } });
  const shelf = { id: 1, type: 'shelfBags' as const, x: 1, y: 1, rotation: 0 as const };

  it('waits on the checkout when the shelf came first, then skips the shelf', () => {
    const withShelf = send(supermarket([shelf]), { type: 'SetDifficulty', difficulty: 'medium' });
    expect(withShelf.venueTutorials?.supermarket).toBe('checkout');
    const checkout = { id: 2, type: 'checkout' as const, x: 3, y: 3, rotation: 0 as const };
    const both = send(supermarket([shelf, checkout]), { type: 'SetDifficulty', difficulty: 'medium' });
    expect(both.venueTutorials?.supermarket).toBe('stock');
  });

  it('keeps waiting on an empty shelf without granting Goods', () => {
    const state = send(supermarket([shelf]), { type: 'SetDifficulty', difficulty: 'medium' });
    expect(state.storage.goods).toEqual({});
  });
});

describe('Skip and replay', () => {
  it('skips a Venue tutorial', () => {
    const state = send(city([venueBuilding(1, 'arcade')], { venueTutorials: { arcade: 'fixture' } }), { type: 'SkipVenueTutorial', venueType: 'arcade' });
    expect(state.venueTutorials?.arcade).toBeNull();
  });

  it('replays from the first step not done, and is unavailable when all are done', () => {
    const started = city([venueBuilding(1, 'arcade')], { venueTutorials: { arcade: null } });
    expect(canReplayVenueTutorial(started, 'arcade')).toBe(true);
    expect(send(started, { type: 'ReplayVenueTutorial', venueType: 'arcade' }).venueTutorials?.arcade).toBe('fixture');
    const done = city([venueBuilding(1, 'arcade', { fixtures: [{ id: 1, type: 'barrelClimber', x: 2, y: 3, rotation: 0 }], nextFixtureId: 2, staff: { employee: 1 }, collected: 3 })], { venueTutorials: { arcade: null } });
    expect(canReplayVenueTutorial(done, 'arcade')).toBe(false);
    expect(send(done, { type: 'ReplayVenueTutorial', venueType: 'arcade' }).venueTutorials?.arcade).toBeNull();
  });
});
