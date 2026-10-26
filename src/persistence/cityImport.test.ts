import { describe, expect, it } from 'vitest';
import { newGame } from '../core';
import { bootCities, FIRST_CITY_ID, readRegistry } from './cities';
import { createCity } from './cityActions';
import { importCityFile } from './cityImport';
import { CityScopedSaveStore } from './cityStore';
import { FORMAT, parseEnvelope, serializeEnvelope } from './envelope';
import { MemorySaveStore, SAVE_KEY } from './saveStore';
import { exportEnvelope } from './transfer';

const T0 = 1_700_000_000_000;
const other = { ...newGame({ seed: 'brisk-owl-1234', now: T0 }), urbs: 123 };

function device(): MemorySaveStore {
  const raw = new MemorySaveStore();
  bootCities(raw, T0);
  return raw;
}

describe('importCityFile', () => {
  it('creates a new City from the file and leaves the existing one untouched', () => {
    const raw = device();
    new CityScopedSaveStore(raw, () => FIRST_CITY_ID).put(SAVE_KEY, 'mine');
    expect(importCityFile(raw, serializeEnvelope(other, T0), T0, 'c1')).toEqual({ ok: true, cityId: 'c1' });
    expect(new CityScopedSaveStore(raw, () => FIRST_CITY_ID).get(SAVE_KEY)).toBe('mine');
    const saved = new CityScopedSaveStore(raw, () => 'c1').get(SAVE_KEY);
    const parsed = saved === null ? null : parseEnvelope(saved);
    expect(parsed?.ok && parsed.state.urbs).toBe(123);
    expect(readRegistry(raw)?.cities.map((city) => city.id)).toEqual([FIRST_CITY_ID, 'c1']);
  });

  it('takes the City name from the file, and the Seed words for a file exported before Cities', () => {
    const raw = device();
    importCityFile(raw, exportEnvelope(other, T0, 'Nova'), T0, 'c1');
    importCityFile(raw, serializeEnvelope(other, T0), T0, 'c2');
    expect(readRegistry(raw)?.cities.map((city) => city.name)).toEqual([null, 'Nova', 'Brisk Owl']);
  });

  it('deduplicates the name against the account\'s Cities', () => {
    const raw = device();
    importCityFile(raw, exportEnvelope(other, T0, 'Nova'), T0, 'c1');
    importCityFile(raw, exportEnvelope(other, T0, 'nova'), T0, 'c2');
    expect(readRegistry(raw)?.cities.map((city) => city.name)).toEqual([null, 'Nova', 'nova 2']);
  });

  it('keeps a long name within the limit even with a suffix', () => {
    const raw = device();
    const long = 'N'.repeat(60);
    importCityFile(raw, exportEnvelope(other, T0, long), T0, 'c1');
    importCityFile(raw, exportEnvelope(other, T0, long), T0, 'c2');
    for (const city of readRegistry(raw)?.cities ?? []) expect((city.name ?? '').length).toBeLessThanOrEqual(32);
  });

  it('is refused at three Cities and writes nothing', () => {
    const raw = device();
    createCity(raw, { cityId: 'c1', now: T0, difficulty: 'cozy', tutorial: false });
    createCity(raw, { cityId: 'c2', now: T0, difficulty: 'cozy', tutorial: false });
    expect(importCityFile(raw, serializeEnvelope(other, T0), T0, 'c3')).toEqual({ ok: false, reason: 'limit' });
    expect(new CityScopedSaveStore(raw, () => 'c3').get(SAVE_KEY)).toBeNull();
    expect(readRegistry(raw)?.cities).toHaveLength(3);
  });

  it('refuses a file that is not a valid save, and touches nothing', () => {
    const raw = device();
    expect(importCityFile(raw, 'nonsense', T0, 'c1')).toEqual({ ok: false, reason: 'invalid-json' });
    expect(importCityFile(raw, JSON.stringify({ format: FORMAT, version: 99, savedAt: 0, state: other }), T0, 'c1')).toEqual({ ok: false, reason: 'newer-version' });
    expect(readRegistry(raw)?.cities).toHaveLength(1);
  });
});

describe('exportEnvelope', () => {
  it('is a valid save carrying the City name', () => {
    const text = exportEnvelope(other, T0, 'Nova');
    expect(parseEnvelope(text)).toMatchObject({ ok: true });
    expect(JSON.parse(text).cityName).toBe('Nova');
  });
});
