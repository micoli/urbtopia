import { describe, expect, it } from 'vitest';
import { newGame } from '../core';
import { bootCities, cityNameFromSeed, nameOpenCity, readRegistry, REGISTRY_KEY } from './cities';
import { CityScopedSaveStore } from './cityStore';
import { serializeEnvelope } from './envelope';
import { META_KEY } from './meta';
import { OWNER_KEY } from './tabOwnership';
import { BACKUP_KEY, MemorySaveStore, SAVE_KEY, SaveQuotaError, versionedBackupKey } from './saveStore';
import { SaveSession } from './saveSession';

const T0 = 1_700_000_000_000;
const city = newGame({ seed: 'gently-amber-fox-4821', now: T0 });

function idGenerator(...ids: string[]): () => string {
  let index = 0;
  return () => ids[index++] ?? `extra-${index}`;
}

describe('cityNameFromSeed', () => {
  it('drops the digits and title-cases the words', () => {
    expect(cityNameFromSeed('gently-amber-fox-4821')).toBe('Gently Amber Fox');
  });

  it('keeps a seed without digits whole', () => {
    expect(cityNameFromSeed('services-compatibility')).toBe('Services Compatibility');
  });
});

describe('bootCities', () => {
  it('creates a first City without a name on a fresh device and opens it', () => {
    const raw = new MemorySaveStore();
    const registry = bootCities(raw, T0, idGenerator('c1'));
    expect(registry).toEqual({ lastPlayed: 'c1', cities: [{ id: 'c1', name: null, createdAt: T0 }] });
    expect(readRegistry(raw)).toEqual(registry);
  });

  it('moves the single legacy save, backups and meta into the first City, named after its Seed', () => {
    const raw = new MemorySaveStore();
    const envelope = serializeEnvelope(city, T0);
    raw.put(SAVE_KEY, envelope);
    raw.put(BACKUP_KEY, 'backup');
    raw.put(versionedBackupKey(3), 'backup-v3');
    raw.put(META_KEY, '{"createdAt":1}');

    const registry = bootCities(raw, T0 + 1, idGenerator('c1'));

    expect(registry.cities).toEqual([{ id: 'c1', name: 'Gently Amber Fox', createdAt: T0 + 1 }]);
    const scoped = new CityScopedSaveStore(raw, () => 'c1');
    expect(scoped.get(SAVE_KEY)).toBe(envelope);
    expect(scoped.get(BACKUP_KEY)).toBe('backup');
    expect(scoped.get(versionedBackupKey(3))).toBe('backup-v3');
    expect(scoped.get(META_KEY)).toBe('{"createdAt":1}');
    expect(raw.get(SAVE_KEY)).toBeNull();
    expect(raw.get(BACKUP_KEY)).toBeNull();
    expect(raw.get(versionedBackupKey(3))).toBeNull();
    expect(raw.get(META_KEY)).toBeNull();
  });

  it('leaves the City unnamed when the legacy save cannot be read', () => {
    const raw = new MemorySaveStore();
    raw.put(SAVE_KEY, 'not json');
    const registry = bootCities(raw, T0, idGenerator('c1'));
    expect(registry.cities[0]?.name).toBeNull();
    expect(new CityScopedSaveStore(raw, () => 'c1').get(SAVE_KEY)).toBe('not json');
  });

  it('is idempotent once the registry exists', () => {
    const raw = new MemorySaveStore();
    const first = bootCities(raw, T0, idGenerator('c1'));
    const second = bootCities(raw, T0 + 5, idGenerator('c2'));
    expect(second).toEqual(first);
  });

  it('rebuilds from the legacy keys when the registry is damaged', () => {
    const raw = new MemorySaveStore();
    raw.put(REGISTRY_KEY, '{broken');
    raw.put(SAVE_KEY, serializeEnvelope(city, T0));
    const registry = bootCities(raw, T0, idGenerator('c1'));
    expect(registry.cities).toHaveLength(1);
    expect(registry.cities[0]?.name).toBe('Gently Amber Fox');
  });
});

describe('nameOpenCity', () => {
  it('names the open City after its Seed when it has no name yet', () => {
    const raw = new MemorySaveStore();
    bootCities(raw, T0, idGenerator('c1'));
    nameOpenCity(raw, 'gently-amber-fox-4821');
    expect(readRegistry(raw)?.cities[0]?.name).toBe('Gently Amber Fox');
  });

  it('keeps an existing name', () => {
    const raw = new MemorySaveStore();
    bootCities(raw, T0, idGenerator('c1'));
    nameOpenCity(raw, 'gently-amber-fox-4821');
    nameOpenCity(raw, 'bold-vivid-owl-1000');
    expect(readRegistry(raw)?.cities[0]?.name).toBe('Gently Amber Fox');
  });
});

describe('CityScopedSaveStore', () => {
  it('keeps the saves, backups and meta of two Cities apart', () => {
    const raw = new MemorySaveStore();
    let open = 'a';
    const scoped = new CityScopedSaveStore(raw, () => open);
    scoped.put(SAVE_KEY, 'save-a');
    scoped.put(META_KEY, 'meta-a');
    open = 'b';
    expect(scoped.get(SAVE_KEY)).toBeNull();
    expect(scoped.get(META_KEY)).toBeNull();
    scoped.put(SAVE_KEY, 'save-b');
    open = 'a';
    expect(scoped.get(SAVE_KEY)).toBe('save-a');
    scoped.remove(SAVE_KEY);
    open = 'b';
    expect(scoped.get(SAVE_KEY)).toBe('save-b');
  });

  it('shares the tab ownership token and the registry across Cities', () => {
    const raw = new MemorySaveStore();
    let open = 'a';
    const scoped = new CityScopedSaveStore(raw, () => open);
    scoped.put(OWNER_KEY, 'token');
    scoped.put(REGISTRY_KEY, '{}');
    open = 'b';
    expect(scoped.get(OWNER_KEY)).toBe('token');
    expect(scoped.get(REGISTRY_KEY)).toBe('{}');
  });

  it('reports a quota error on one City without touching the other', () => {
    const raw = new MemorySaveStore();
    let open = 'a';
    const scoped = new CityScopedSaveStore(raw, () => open);
    scoped.put(SAVE_KEY, 'save-a');
    raw.failNextPutWith('quota');
    open = 'b';
    expect(() => scoped.put(SAVE_KEY, 'save-b')).toThrow(SaveQuotaError);
    open = 'a';
    expect(scoped.get(SAVE_KEY)).toBe('save-a');
  });

  it('lets a SaveSession load only the open City', () => {
    const raw = new MemorySaveStore();
    let open = 'a';
    const session = new SaveSession(new CityScopedSaveStore(raw, () => open));
    session.save(city, T0);
    open = 'b';
    expect(session.load().kind).toBe('none');
    open = 'a';
    expect(session.load().kind).toBe('loaded');
  });
});
