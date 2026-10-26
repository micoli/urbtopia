import { describe, expect, it } from 'vitest';
import { newGame, type GameState, type TradeLedgerEntry } from '../core';
import { bootCities, cityNameProblem, FIRST_CITY_ID, nameOpenCity, readRegistry, uniqueCityName } from './cities';
import { createCity, removeCity, renameCity, switchCity } from './cityActions';
import { cityDeletionBlockers } from './cityDeletion';
import { CityScopedSaveStore } from './cityStore';
import { parseEnvelope } from './envelope';
import { MemorySaveStore, SAVE_KEY } from './saveStore';

const T0 = 1_700_000_000_000;

function deviceWithCities(count: number): MemorySaveStore {
  const raw = new MemorySaveStore();
  bootCities(raw, T0);
  for (let index = 1; index < count; index += 1) createCity(raw, { cityId: `c${index}`, now: T0 + index, difficulty: 'cozy', tutorial: false });
  return raw;
}

function names(raw: MemorySaveStore): (string | null)[] {
  return (readRegistry(raw)?.cities ?? []).map((entry) => entry.name);
}

describe('uniqueCityName', () => {
  it('keeps a free name and suffixes a taken one, ignoring case', () => {
    expect(uniqueCityName(['Other'], 'Amber Fox')).toBe('Amber Fox');
    expect(uniqueCityName(['amber fox'], 'Amber Fox')).toBe('Amber Fox 2');
    expect(uniqueCityName(['Amber Fox', 'Amber Fox 2'], 'Amber Fox')).toBe('Amber Fox 3');
  });
});

describe('cityNameProblem', () => {
  const registry = { lastPlayed: 'a', cities: [{ id: 'a', name: 'Alpha', createdAt: 0 }, { id: 'b', name: 'Beta', createdAt: 0 }] };

  it.each([
    ['', 'empty'],
    ['   ', 'empty'],
    ['x'.repeat(33), 'too-long'],
    ['beta', 'taken'],
  ] as const)('refuses %j as %s', (name, problem) => {
    expect(cityNameProblem(registry, 'a', name)).toBe(problem);
  });

  it('accepts 32 characters and the City\'s own name in another case', () => {
    expect(cityNameProblem(registry, 'a', 'x'.repeat(32))).toBeNull();
    expect(cityNameProblem(registry, 'a', 'ALPHA')).toBeNull();
  });
});

describe('createCity', () => {
  it('writes a new game under its own id, named after its Seed, with the chosen Difficulty', () => {
    const raw = deviceWithCities(1);
    nameOpenCity(raw, 'bold-vivid-owl-1000');
    const result = createCity(raw, { cityId: 'c1', now: T0 + 5, difficulty: 'hard', tutorial: true });
    expect(result).toEqual({ ok: true, cityId: 'c1' });

    const saved = new CityScopedSaveStore(raw, () => 'c1').get(SAVE_KEY);
    const parsed = saved === null ? null : parseEnvelope(saved);
    expect(parsed?.ok && parsed.state.difficulty).toBe('hard');
    expect(parsed?.ok && parsed.state.tutorial).not.toBeNull();
    expect(readRegistry(raw)?.cities).toHaveLength(2);
    expect(readRegistry(raw)?.lastPlayed).toBe(FIRST_CITY_ID);
  });

  it('is refused at three Cities and leaves the registry alone', () => {
    const raw = deviceWithCities(3);
    expect(createCity(raw, { cityId: 'c9', now: T0, difficulty: 'cozy', tutorial: false })).toEqual({ ok: false, reason: 'limit' });
    expect(readRegistry(raw)?.cities).toHaveLength(3);
  });
});

describe('renameCity', () => {
  it('renames, trimming the name', () => {
    const raw = deviceWithCities(2);
    expect(renameCity(raw, 'c1', '  Nova  ')).toEqual({ ok: true });
    expect(names(raw)[1]).toBe('Nova');
  });

  it('refuses a duplicate regardless of case and keeps the old name', () => {
    const raw = deviceWithCities(2);
    renameCity(raw, 'c1', 'Nova');
    expect(renameCity(raw, 'c1', 'x'.repeat(40))).toEqual({ ok: false, reason: 'too-long' });
    nameOpenCity(raw, 'bold-vivid-owl-1000');
    expect(renameCity(raw, FIRST_CITY_ID, 'nova')).toEqual({ ok: false, reason: 'taken' });
    expect(names(raw)[1]).toBe('Nova');
  });
});

describe('switchCity', () => {
  it('opens a known City next boot and ignores an unknown one', () => {
    const raw = deviceWithCities(2);
    expect(switchCity(raw, 'c1')).toBe(true);
    expect(bootCities(raw, T0).lastPlayed).toBe('c1');
    expect(switchCity(raw, 'nope')).toBe(false);
    expect(readRegistry(raw)?.lastPlayed).toBe('c1');
  });
});

describe('removeCity', () => {
  it('removes the City, its save and its backups, and opens another when it was the open one', () => {
    const raw = deviceWithCities(2);
    switchCity(raw, 'c1');
    const store = new CityScopedSaveStore(raw, () => 'c1');
    store.put('urbtopia-save-backup', 'backup');
    expect(removeCity(raw, 'c1')).toEqual({ ok: true });
    expect(store.get(SAVE_KEY)).toBeNull();
    expect(store.get('urbtopia-save-backup')).toBeNull();
    expect(readRegistry(raw)).toMatchObject({ lastPlayed: FIRST_CITY_ID });
  });

  it('never removes the last City', () => {
    const raw = deviceWithCities(1);
    expect(removeCity(raw, FIRST_CITY_ID)).toEqual({ ok: false, reason: 'last-city' });
  });

  it('keeps the other Cities untouched', () => {
    const raw = deviceWithCities(3);
    const other = new CityScopedSaveStore(raw, () => 'c2').get(SAVE_KEY);
    removeCity(raw, 'c1');
    expect(new CityScopedSaveStore(raw, () => 'c2').get(SAVE_KEY)).toBe(other);
  });
});

describe('cityDeletionBlockers', () => {
  const base = newGame({ seed: 'amber-fox-4821', now: T0 });
  const entry = (offerId: string, effect: TradeLedgerEntry['effect'], confirmed = true): TradeLedgerEntry => ({ offerId, effect, at: T0, confirmed });
  const withLedger = (tradeLedger: TradeLedgerEntry[]): GameState => ({ ...base, tradeLedger });

  it('has no blocker for a quiet City', () => {
    expect(cityDeletionBlockers(base)).toEqual([]);
  });

  it('blocks on an accepted Challenge', () => {
    expect(cityDeletionBlockers({ ...base, challenge: { id: 'c1', goal: [], deadline: T0 + 1 } as unknown as GameState['challenge'] })).toEqual(['challenge']);
  });

  it('blocks on a sent offer until it is paid or returned', () => {
    expect(cityDeletionBlockers(withLedger([entry('o1', 'reserve-lot')]))).toEqual(['trade']);
    expect(cityDeletionBlockers(withLedger([entry('o1', 'reserve-lot'), entry('o1', 'receive-payment')]))).toEqual([]);
    expect(cityDeletionBlockers(withLedger([entry('o1', 'reserve-lot'), entry('o1', 'return-lot')]))).toEqual([]);
  });

  it('blocks on an accepted offer until the Lot is received or the payment returned', () => {
    expect(cityDeletionBlockers(withLedger([entry('o1', 'pay')]))).toEqual(['trade']);
    expect(cityDeletionBlockers(withLedger([entry('o1', 'pay'), entry('o1', 'receive-lot')]))).toEqual([]);
  });

  it('blocks on an effect the server has not acknowledged', () => {
    expect(cityDeletionBlockers(withLedger([entry('o1', 'return-lot', false)]))).toEqual(['trade']);
  });
});
