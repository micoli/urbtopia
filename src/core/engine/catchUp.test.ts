import fc from 'fast-check';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { WALKING } from '../traffic/walking';
import { GAME_CONFIG, advance, dispatch, newGame, type Command, type GameState } from '../index';

const walkingEnabled = WALKING.enabled;
beforeAll(() => {
  WALKING.enabled = false;
});
afterAll(() => {
  WALKING.enabled = walkingEnabled;
});

const T0 = 1_700_000_000_000;
const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const CAP = GAME_CONFIG.offlineCapMs;

function succeed(state: GameState, command: Command, now = T0): GameState {
  const result = dispatch(state, command, now);
  if (!result.ok) throw new Error(`expected success, got ${result.error.key}`);
  return result.state;
}

function busyCity(): GameState {
  let state: GameState = { ...newGame({ seed: 'amber-fox-4821', now: T0 }), urbs: 100_000 };
  const commands: Command[] = [
    { type: 'PlaceBuilding', buildingType: 'storehouse', x: 56, y: 59 },
    { type: 'PlaceBuilding', buildingType: 'powerPlant', x: 70, y: 70 },
    { type: 'PlaceBuilding', buildingType: 'waterTower', x: 72, y: 70 },
    { type: 'PlaceBuilding', buildingType: 'home', x: 53, y: 57 },
    { type: 'PlaceBuilding', buildingType: 'shop', x: 58, y: 57 },
    { type: 'QueueProduction', buildingId: 1, item: 'wood' },
    { type: 'QueueProduction', buildingId: 1, item: 'stone' },
  ];
  for (const command of commands) state = succeed(state, command);
  return { ...state, storage: { materials: {}, goods: { planks: 10 } }, marketUnlocked: true };
}

describe('Catch-up within the cap', () => {
  const base = busyCity();
  const shopId = base.buildings.find((b) => b.type === 'shop')?.id ?? 0;
  const city = succeed(base, { type: 'StockShop', buildingId: shopId, good: 'planks' });

  it('gives the same result whether the gap is replayed in one call or in steps', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 40 * HOUR }), fc.integer({ min: 0, max: 40 * HOUR }), (a, b) => {
        const [first, second] = [T0 + Math.min(a, b), T0 + Math.max(a, b)];
        expect(advance(advance(city, first).state, second).state).toEqual(advance(city, second).state);
      }),
      { numRuns: 100 },
    );
  });

  it('does not depend on a save and reload in the middle of the gap', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 40 * HOUR }), fc.integer({ min: 0, max: 40 * HOUR }), (a, b) => {
        const [first, second] = [T0 + Math.min(a, b), T0 + Math.max(a, b)];
        const reloaded: GameState = JSON.parse(JSON.stringify(advance(city, first).state));
        expect(advance(reloaded, second).state).toEqual(advance(city, second).state);
      }),
      { numRuns: 100 },
    );
  });

  it('applies Slot completion, Shop sales and Tax together', () => {
    const { state, events } = advance(city, T0 + 10 * HOUR);
    expect(state.buildings.find((b) => b.id === 1)?.queue.every((entry) => entry.done)).toBe(true);
    expect(state.buildings.find((b) => b.type === 'shop')?.stacks[0]).toMatchObject({ stock: 0, earned: 70 });
    expect(state.buildings.find((b) => b.type === 'home')?.taxCitizenMs).toBe(6 * 8 * HOUR);
    expect(events.some((event) => event.type === 'OfflineTimeCapped')).toBe(false);
  });
});

describe('Catch-up beyond the cap', () => {
  const city = busyCity();

  it('replays only 48 hours, forfeits the rest and resets lastSeen to now', () => {
    const { state, events } = advance(city, T0 + 100 * HOUR);
    expect(state.lastSeen).toBe(T0 + 100 * HOUR);
    expect(events).toContainEqual({ type: 'OfflineTimeCapped', forfeitedMs: 100 * HOUR - CAP });
  });

  it('caps Tax at what 48 hours would have given, which is already limited to 8 hours', () => {
    const { state } = advance(city, T0 + 100 * HOUR);
    expect(state.buildings.find((b) => b.type === 'home')?.taxCitizenMs).toBe(6 * 8 * HOUR);
  });

  it('does not count forfeited time for what is still running', () => {
    const slow: GameState = {
      ...city,
      buildings: city.buildings.map((b) =>
        b.id === 1 ? { ...b, queue: [{ item: 'wood', duration: 60 * HOUR, startedAt: T0, done: false, quantity: 1 }] } : b,
      ),
    };
    const { state } = advance(slow, T0 + 100 * HOUR);
    const entry = state.buildings.find((b) => b.id === 1)?.queue[0];
    expect(entry?.done).toBe(false);
    expect((entry?.startedAt ?? 0) + (entry?.duration ?? 0) - state.lastSeen).toBe(60 * HOUR - CAP);
  });

  it('is exactly at the cap when the gap equals 48 hours: nothing is forfeited', () => {
    const { events } = advance(city, T0 + CAP);
    expect(events.some((event) => event.type === 'OfflineTimeCapped')).toBe(false);
  });

  it('applies to a command too, since dispatch brings the city up to date first', () => {
    const result = dispatch(city, { type: 'Collect', buildingId: 1 }, T0 + 100 * HOUR);
    if (!result.ok) throw new Error(result.error.key);
    expect(result.events.some((event) => event.type === 'OfflineTimeCapped')).toBe(true);
  });
});

describe('clock changes', () => {
  it('ignores a clock that went backwards', () => {
    const city = busyCity();
    const { state, events } = advance(city, T0 - 10 * HOUR);
    expect(state).toEqual(city);
    expect(events).toEqual([]);
  });
});
