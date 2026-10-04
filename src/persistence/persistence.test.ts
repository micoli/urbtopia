import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { newGame, storageCapacity, type GameState } from '../core';
import fixtureV1 from './fixtures/save-v1.json';
import fixtureV2 from './fixtures/save-v2.json';
import fixtureV3 from './fixtures/save-v3.json';
import { CURRENT_VERSION, FORMAT, parseEnvelope, serializeEnvelope } from './envelope';
import { MemorySaveStore, SAVE_KEY } from './saveStore';
import { SaveSession } from './saveSession';
import { createAutosave } from './autosave';
import { validateGameState } from './validate';
import { migrate } from './migrations';

const T0 = 1_700_000_000_000;
const state = newGame({ seed: 'amber-fox-4821', now: T0 });

describe('validateGameState', () => {
  it('accepts a fresh game and a played game', () => {
    expect(validateGameState(state)).not.toBeNull();
    expect(parseEnvelope(JSON.stringify(fixtureV3)).ok).toBe(true);
  });

  it.each([
    ['a missing field', () => ({ ...state, urbs: undefined })],
    ['a negative amount of Urbs', () => ({ ...state, urbs: -1 })],
    ['a non-finite number', () => ({ ...state, lastSeen: Number.NaN })],
    ['an unknown building type', () => ({ ...state, buildings: [{ ...state.buildings[0], type: 'castle' }] })],
    ['a bad rotation', () => ({ ...state, buildings: [{ ...state.buildings[0], rotation: 7 }] })],
    ['an unknown item in a queue', () => ({ ...state, buildings: [{ ...state.buildings[0], queue: [{ item: 'gold', duration: 1, startedAt: 0, done: false }] }] })],
    ['a Parcel outside the map', () => ({ ...state, ownedParcels: [{ x: 9, y: 0 }] })],
    ['a road of unknown kind', () => ({ ...state, roads: [{ x: 1, y: 1, kind: 'highway' }] })],
    ['a non-object', () => 'hello'],
    ['null', () => null],
  ])('rejects %s', (_label, make) => {
    expect(validateGameState(make())).toBeNull();
  });
});

describe('envelope', () => {
  it('wraps the state with format, version and save time', () => {
    const parsed = JSON.parse(serializeEnvelope(state, T0 + 5));
    expect(parsed).toMatchObject({ format: FORMAT, version: CURRENT_VERSION, savedAt: T0 + 5 });
  });

  it('survives a round trip unchanged', () => {
    const result = parseEnvelope(serializeEnvelope(state, T0));
    expect(result).toEqual({ ok: true, state, savedAt: T0 });
  });

  it('loads the frozen version 3 fixture', () => {
    const result = parseEnvelope(JSON.stringify(fixtureV3));
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.state.seed).toBe('amber-fox-4821');
  });

  it('loads the frozen version 2 fixture, giving queued items a quantity of 1', () => {
    const result = parseEnvelope(JSON.stringify(fixtureV2));
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.state.buildings.flatMap((b) => b.queue).every((entry) => entry.quantity === 1)).toBe(true);
  });

  it('reads the seed of the frozen version 2 fixture', () => {
    const result = parseEnvelope(JSON.stringify(fixtureV2));
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.state.seed).toBe('amber-fox-4821');
  });

  it('loads the frozen version 1 fixture', () => {
    const result = parseEnvelope(JSON.stringify(fixtureV1));
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.state.seed).toBe('amber-fox-4821');
  });

  it.each([
    ['text that is not JSON', 'not json', 'invalid-json'],
    ['another format', JSON.stringify({ format: 'other', version: 1, savedAt: 0, state }), 'wrong-format'],
    ['a version newer than the app', JSON.stringify({ format: FORMAT, version: CURRENT_VERSION + 1, savedAt: 0, state }), 'newer-version'],
    ['an invalid state', JSON.stringify({ format: FORMAT, version: CURRENT_VERSION, savedAt: 0, state: { urbs: 1 } }), 'invalid-state'],
    ['a missing envelope field', JSON.stringify({ format: FORMAT, state }), 'wrong-format'],
  ])('refuses %s', (_label, text, reason) => {
    expect(parseEnvelope(text)).toEqual({ ok: false, reason });
  });
});

describe('migration from version 1', () => {
  const v1State = fixtureV1.state as Record<string, unknown> & { buildings: { type: string; tier: number }[] };
  const load = (storehouseLevel: number) => {
    const result = parseEnvelope(JSON.stringify({ ...fixtureV1, state: { ...v1State, storehouseLevel } }));
    if (!result.ok) throw new Error(result.reason);
    return result.state;
  };

  it('gives every non-Home building Tier 1 and keeps the Home Tiers', () => {
    const loaded = load(0);
    const originals = v1State.buildings;
    loaded.buildings.slice(0, originals.length).forEach((building, index) => {
      expect(building.tier).toBe(originals[index]?.type === 'home' ? originals[index]?.tier : 1);
    });
  });

  it('turns the global Storehouse level into the Storehouse Tier, keeping its capacity', () => {
    const loaded = load(3);
    expect(loaded.buildings.find((b) => b.type === 'storehouse')?.tier).toBe(4);
    expect(storageCapacity(loaded)).toEqual({ materials: 50, crops: 0, goods: 100 });
    expect('storehouseLevel' in loaded).toBe(false);
  });
});

describe('migrate', () => {
  it('applies each step in order from the saved version to the current one', () => {
    const steps = {
      1: (value: unknown) => ({ ...(value as object), a: 1 }),
      2: (value: unknown) => ({ ...(value as object), b: 2 }),
    };
    expect(migrate({ base: true }, 1, 3, steps)).toEqual({ base: true, a: 1, b: 2 });
    expect(migrate({ base: true }, 2, 3, steps)).toEqual({ base: true, b: 2 });
    expect(migrate({ base: true }, 3, 3, steps)).toEqual({ base: true });
  });

  it('fails when a step is missing', () => {
    expect(() => migrate({}, 1, 2, {})).toThrow();
  });
});

describe('SaveSession', () => {
  let store: MemorySaveStore;
  let session: SaveSession;
  beforeEach(() => {
    store = new MemorySaveStore();
    session = new SaveSession(store);
  });

  it('starts with nothing to load', () => {
    expect(session.load()).toEqual({ kind: 'none' });
  });

  it('loads what it saved', () => {
    session.save(state, T0);
    expect(session.load()).toEqual({ kind: 'loaded', state, savedAt: T0 });
  });

  it('keeps an unreadable save untouched and refuses to overwrite it', () => {
    store.put(SAVE_KEY, 'garbage');
    const result = session.load();
    expect(result).toMatchObject({ kind: 'failed', reason: 'invalid-json', raw: 'garbage' });
    expect(session.save(state, T0)).toEqual({ ok: false, reason: 'locked' });
    expect(store.get(SAVE_KEY)).toBe('garbage');
  });

  it('never overwrites a save written by a newer version', () => {
    const newer = JSON.stringify({ format: FORMAT, version: CURRENT_VERSION + 1, savedAt: 0, state });
    store.put(SAVE_KEY, newer);
    expect(session.load()).toMatchObject({ kind: 'failed', reason: 'newer-version' });
    session.save(state, T0);
    expect(store.get(SAVE_KEY)).toBe(newer);
  });

  it('can be unlocked on purpose, to start a new game over a bad save', () => {
    store.put(SAVE_KEY, 'garbage');
    session.load();
    session.unlock();
    expect(session.save(state, T0)).toEqual({ ok: true });
  });

  it('reports a full storage instead of throwing', () => {
    store.failNextPutWith('quota');
    expect(session.save(state, T0)).toEqual({ ok: false, reason: 'quota' });
  });
});

describe('autosave', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  function setup() {
    const save = vi.fn();
    const autosave = createAutosave({ save });
    return { save, autosave };
  }

  it('saves 2 seconds after the last command, grouping rapid commands', () => {
    const { save, autosave } = setup();
    autosave.onCommand();
    vi.advanceTimersByTime(1500);
    autosave.onCommand();
    vi.advanceTimersByTime(1500);
    expect(save).not.toHaveBeenCalled();
    vi.advanceTimersByTime(600);
    expect(save).toHaveBeenCalledTimes(1);
  });

  it('saves every 30 seconds while passive changes are pending, but not when nothing changed', () => {
    const { save, autosave } = setup();
    vi.advanceTimersByTime(60_000);
    expect(save).not.toHaveBeenCalled();
    autosave.onPassiveChange();
    vi.advanceTimersByTime(30_000);
    expect(save).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(60_000);
    expect(save).toHaveBeenCalledTimes(1);
  });

  it('saves at once when the page is hidden, only if something is pending', () => {
    const { save, autosave } = setup();
    autosave.flush();
    expect(save).not.toHaveBeenCalled();
    autosave.onPassiveChange();
    autosave.flush();
    expect(save).toHaveBeenCalledTimes(1);
  });

  it('can be stopped', () => {
    const { save, autosave } = setup();
    autosave.onCommand();
    autosave.dispose();
    vi.advanceTimersByTime(60_000);
    expect(save).not.toHaveBeenCalled();
  });
});

export type { GameState };
