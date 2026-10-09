import { describe, expect, it } from 'vitest';
import { createBuilding, dispatch, newGame } from '../core';
import { parseEnvelope, serializeEnvelope } from './envelope';

describe('Venue save', () => {
  const base = { ...newGame({ seed: 'venue-save', now: 0 }), urbs: 5_000, tutorial: null, nextId: 10, buildings: [createBuilding(1, 'arcade', 55, 50, 0)] };

  it('keeps Fixtures and Takings through a save and a load', () => {
    const placed = dispatch(base, { type: 'PlaceFixture', buildingId: 1, fixture: 'barrelClimber', x: 1, y: 1 }, 0);
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

  it('keeps the Staff and the price, and refuses an unknown role', () => {
    const staffed = { ...base, buildings: [{ ...base.buildings[0]!, venue: { ...base.buildings[0]!.venue!, price: 4, staff: { manager: 1, employee: 2 } } }] };
    const loaded = parseEnvelope(serializeEnvelope(staffed, 0));
    if (!loaded.ok) throw new Error(loaded.reason);
    expect(loaded.state.buildings[0]!.venue).toMatchObject({ price: 4, staff: { manager: 1, employee: 2 } });
    const unknown = { ...base, buildings: [{ ...base.buildings[0]!, venue: { ...base.buildings[0]!.venue!, staff: { janitor: 1 } } }] };
    expect(parseEnvelope(serializeEnvelope(unknown as never, 0)).ok).toBe(false);
  });

  it('keeps the Condition of Fixtures, a breakdown and the breakdown stream, so a reload never dodges one', () => {
    const fixtures = [{ id: 1, type: 'barrelClimber', x: 1, y: 1, rotation: 0, condition: 12.5, broken: true }, { id: 2, type: 'counter', x: 3, y: 1, rotation: 0 }];
    const worn = { ...base, buildings: [{ ...base.buildings[0]!, venue: { fixtures, nextFixtureId: 3, takings: 0, rng: 123456 } }] };
    const loaded = parseEnvelope(serializeEnvelope(worn as never, 0));
    if (!loaded.ok) throw new Error(loaded.reason);
    expect(loaded.state.buildings[0]!.venue).toEqual(worn.buildings[0]!.venue);
    const tooWorn = { ...worn, buildings: [{ ...worn.buildings[0]!, venue: { ...worn.buildings[0]!.venue, fixtures: [{ ...fixtures[0]!, condition: 140 }] } }] };
    expect(parseEnvelope(serializeEnvelope(tooWorn as never, 0)).ok).toBe(false);
  });

  it('keeps a planned event and a cooldown, and refuses an event that ends before it starts', () => {
    const event = { startsAt: 1000, endsAt: 5000, budget: 300 };
    const planned = { ...base, buildings: [{ ...base.buildings[0]!, venue: { ...base.buildings[0]!.venue!, event, cooldownUntil: 9000 } }] };
    const loaded = parseEnvelope(serializeEnvelope(planned, 0));
    if (!loaded.ok) throw new Error(loaded.reason);
    expect(loaded.state.buildings[0]!.venue).toMatchObject({ event, cooldownUntil: 9000 });
    const backwards = { ...planned, buildings: [{ ...planned.buildings[0]!, venue: { ...planned.buildings[0]!.venue, event: { ...event, endsAt: 500 } } }] };
    expect(parseEnvelope(serializeEnvelope(backwards as never, 0)).ok).toBe(false);
  });

  it('keeps the shelves of a Supermarket and the reputation of a Hotel, and refuses nonsense', () => {
    const shelf = { id: 1, type: 'shelfBags', x: 1, y: 1, rotation: 0, good: 'planks', stock: 7.5 };
    const market = { ...base, buildings: [{ ...createBuilding(1, 'supermarket', 55, 50, 0), venue: { fixtures: [shelf], nextFixtureId: 2, takings: 0, staff: { cashier: 2, stocker: 1 } } }] };
    const loaded = parseEnvelope(serializeEnvelope(market as never, 0));
    if (!loaded.ok) throw new Error(loaded.reason);
    expect(loaded.state.buildings[0]!.venue!.fixtures[0]).toEqual(shelf);
    expect(parseEnvelope(serializeEnvelope({ ...market, buildings: [{ ...market.buildings[0]!, venue: { ...market.buildings[0]!.venue, fixtures: [{ ...shelf, good: 'unobtainium' }] } }] } as never, 0)).ok).toBe(false);
    expect(parseEnvelope(serializeEnvelope({ ...market, buildings: [{ ...market.buildings[0]!, venue: { ...market.buildings[0]!.venue, fixtures: [{ ...shelf, stock: -1 }] } }] } as never, 0)).ok).toBe(false);
    expect(parseEnvelope(serializeEnvelope({ ...market, buildings: [{ ...market.buildings[0]!, venue: { ...market.buildings[0]!.venue, staff: { cashier: 1, receptionist: 1 } } }] } as never, 0)).ok).toBe(true);

    const hotel = { ...base, buildings: [{ ...createBuilding(1, 'hotel', 55, 50, 0), venue: { fixtures: [], nextFixtureId: 1, takings: 3, reputation: 72.5, staff: { receptionist: 1, housekeeper: 2 } } }] };
    const kept = parseEnvelope(serializeEnvelope(hotel as never, 0));
    if (!kept.ok) throw new Error(kept.reason);
    expect(kept.state.buildings[0]!.venue).toMatchObject({ reputation: 72.5, staff: { receptionist: 1, housekeeper: 2 } });
    expect(parseEnvelope(serializeEnvelope({ ...hotel, buildings: [{ ...hotel.buildings[0]!, venue: { ...hotel.buildings[0]!.venue, reputation: 140 } }] } as never, 0)).ok).toBe(false);
  });

  it('keeps what a Venue has earned, and refuses a negative amount', () => {
    const earned = { ...base, buildings: [{ ...base.buildings[0]!, venue: { ...base.buildings[0]!.venue!, earned: 420.5 } }] };
    const loaded = parseEnvelope(serializeEnvelope(earned, 0));
    if (!loaded.ok) throw new Error(loaded.reason);
    expect(loaded.state.buildings[0]!.venue).toMatchObject({ earned: 420.5 });
    const negative = { ...base, buildings: [{ ...base.buildings[0]!, venue: { ...base.buildings[0]!.venue!, earned: -1 } }] };
    expect(parseEnvelope(serializeEnvelope(negative, 0)).ok).toBe(false);
  });
});
