import { describe, expect, it } from 'vitest';
import { advance, createBuilding, dispatch, newGame, type Command, type GameState } from '../core';
import { checkGameState } from './validate';

const H = 3_600_000;
const send = (state: GameState, command: Command): GameState => {
  const result = dispatch(state, command, 0);
  if (!result.ok) throw new Error(result.error.key);
  return result.state;
};

describe('a saved Restaurant', () => {
  const start: GameState = {
    ...newGame({ seed: 'restaurant', now: 0 }), nextId: 100, urbs: 100_000, tutorial: null, adaptationUntil: 0, lastSeen: 0,
    storage: { materials: { milk: 50 }, goods: { bread: 50 } },
    buildings: [createBuilding(1, 'restaurant', 55, 50, 0), createBuilding(2, 'home', 52, 50, 0), createBuilding(3, 'coalPlant', 90, 40, 0)].map((building, index) => (index === 1 ? { ...building, tier: 4 } : building)),
  };
  const fitted = [
    { type: 'PlaceFixture', buildingId: 1, fixture: 'cooktop', x: 1, y: 3, rotation: 0 },
    { type: 'PlaceFixture', buildingId: 1, fixture: 'restaurantTable', x: 3, y: 2, rotation: 0 },
    { type: 'PlaceFixture', buildingId: 1, fixture: 'restaurantChair', x: 3, y: 1, rotation: 0 },
    { type: 'PlaceFixture', buildingId: 1, fixture: 'restaurantCheckout', x: 6, y: 1, rotation: 0 },
    { type: 'HireStaff', buildingId: 1, role: 'cook' },
    { type: 'HireStaff', buildingId: 1, role: 'waiter' },
    { type: 'SetMenu', buildingId: 1, menu: ['milk', 'bread'] },
  ] as Command[];

  it('keeps its Menu, its Staff and what it has eaten through a save', () => {
    const state = advance(fitted.reduce(send, start), 1.7 * H).state;
    const loaded = JSON.parse(JSON.stringify(state));
    const check = checkGameState(loaded);
    expect(check.ok ? 'ok' : check.reason).toBe('ok');
    expect(loaded.buildings[0].venue.menu).toEqual(['milk', 'bread']);
    expect(loaded.buildings[0].venue.eaten).toBeDefined();
  });

  it('refuses a Menu with an item the game does not know, and an eaten fraction of a whole unit or more', () => {
    const state = fitted.reduce(send, start);
    const venue = (extra: object) => JSON.parse(JSON.stringify({ ...state, buildings: state.buildings.map(b => (b.id === 1 ? { ...b, venue: { ...b.venue, ...extra } } : b)) }));
    expect(checkGameState(venue({ menu: ['milk', 'unobtainium'] })).ok).toBe(false);
    expect(checkGameState(venue({ eaten: { milk: 1.5 } })).ok).toBe(false);
    expect(checkGameState(venue({ eaten: { milk: 0.5 } })).ok).toBe(true);
  });
});
