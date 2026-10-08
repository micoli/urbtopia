import { describe, expect, it } from 'vitest';
import { createBuilding, dispatch, newGame } from '../core';
import { parseEnvelope, serializeEnvelope } from './envelope';

describe('Venue save', () => {
  const base = { ...newGame({ seed: 'venue-save', now: 0 }), urbs: 5_000, tutorial: null, nextId: 10, buildings: [createBuilding(1, 'arcade', 55, 50, 0)] };

  it('keeps Fixtures and Takings through a save and a load', () => {
    const placed = dispatch(base, { type: 'PlaceFixture', buildingId: 1, fixture: 'arcadeMachine', x: 1, y: 1 }, 0);
    if (!placed.ok) throw new Error(placed.error.key);
    const state = { ...placed.state, buildings: placed.state.buildings.map(b => ({ ...b, venue: { ...b.venue!, takings: 12.5 } })) };
    const loaded = parseEnvelope(serializeEnvelope(state, 0));
    if (!loaded.ok) throw new Error(loaded.reason);
    expect(loaded.state.buildings[0]!.venue).toEqual(state.buildings[0]!.venue);
  });

  it('refuses a Venue with an unknown Fixture or on a non-Venue building', () => {
    const venue = { fixtures: [{ id: 1, type: 'unknown', x: 0, y: 0, rotation: 0 }], nextFixtureId: 2, takings: 0 };
    const badFixture = { ...base, buildings: [{ ...base.buildings[0]!, venue }] };
    expect(parseEnvelope(serializeEnvelope(badFixture as never, 0)).ok).toBe(false);
    const wrongType = { ...base, buildings: [{ ...createBuilding(1, 'home', 55, 50, 0), venue: { fixtures: [], nextFixtureId: 1, takings: 0 } }] };
    expect(parseEnvelope(serializeEnvelope(wrongType, 0)).ok).toBe(false);
  });
});
