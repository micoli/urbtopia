import { beforeEach, describe, expect, it } from 'vitest';
import { advance, newGame, type GameState } from '../core';
import fixtureV1 from './fixtures/save-v1.json';
import { FORMAT, parseEnvelope, serializeEnvelope } from './envelope';
import { BACKUP_KEY, exportFileName, importCity, restoreBackup } from './transfer';
import { MemorySaveStore, SAVE_KEY } from './saveStore';
import { SaveSession } from './saveSession';
import { META_KEY, readMeta, recordExport, shouldRemindExport } from './meta';
import { TabOwnership } from './tabOwnership';

const T0 = 1_700_000_000_000;
const DAY = 86_400_000;
const state: GameState = newGame({ seed: 'amber-fox-4821', now: T0 });
const other: GameState = { ...newGame({ seed: 'brisk-owl-1234', now: T0 }), urbs: 123 };

describe('backup', () => {
  let store: MemorySaveStore;
  let session: SaveSession;
  beforeEach(() => {
    store = new MemorySaveStore();
    session = new SaveSession(store);
  });

  it('keeps a copy of the current save on request', () => {
    session.save(state, T0);
    session.backupNow();
    expect(store.get(BACKUP_KEY)).toBe(store.get(SAVE_KEY));
  });

  it('does nothing when there is no save, and never backs up a broken save', () => {
    session.backupNow();
    expect(store.get(BACKUP_KEY)).toBeNull();
    store.put(SAVE_KEY, 'garbage');
    session.backupNow();
    expect(store.get(BACKUP_KEY)).toBeNull();
  });

  it('is made before a migration touches an old save', () => {
    store.put(SAVE_KEY, JSON.stringify(fixtureV1));
    const migrating = new SaveSession(store);
    expect(migrating.load()).toMatchObject({ kind: 'loaded' });
    expect(store.get(BACKUP_KEY)).toBe(JSON.stringify(fixtureV1));
  });

  it('restores the backup as the current save', () => {
    session.save(state, T0);
    session.backupNow();
    store.put(SAVE_KEY, 'garbage');
    const restored = restoreBackup(store, session);
    expect(restored).toMatchObject({ ok: true });
    expect(session.load()).toMatchObject({ kind: 'loaded' });
  });

  it('cannot restore when there is no usable backup', () => {
    expect(restoreBackup(store, session)).toEqual({ ok: false, reason: 'no-backup' });
    store.put(BACKUP_KEY, 'garbage');
    expect(restoreBackup(store, session)).toEqual({ ok: false, reason: 'no-backup' });
  });
});

describe('export', () => {
  it('names the file with the Seed and the date', () => {
    expect(exportFileName(state, Date.UTC(2026, 9, 2))).toBe('urbtopia-amber-fox-4821-2026-10-02.json');
  });
});

describe('importCity', () => {
  it('refuses a file that is not a valid save, and touches nothing', () => {
    const store = new MemorySaveStore();
    const session = new SaveSession(store);
    session.save(state, T0);
    const before = store.get(SAVE_KEY);
    expect(importCity('nonsense', session, T0)).toEqual({ ok: false, reason: 'invalid-json' });
    expect(importCity(JSON.stringify({ format: FORMAT, version: 99, savedAt: 0, state }), session, T0)).toEqual({ ok: false, reason: 'newer-version' });
    expect(store.get(SAVE_KEY)).toBe(before);
    expect(store.get(BACKUP_KEY)).toBeNull();
  });

  it('puts the previous save in the backup slot and returns the imported city brought up to date', () => {
    const store = new MemorySaveStore();
    const session = new SaveSession(store);
    session.save(state, T0);
    const previous = store.get(SAVE_KEY);
    const result = importCity(serializeEnvelope(other, T0), session, T0 + 3_600_000);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.state).toEqual(advance(other, T0 + 3_600_000).state);
    expect(store.get(BACKUP_KEY)).toBe(previous);
  });

  it('round trips an exported city', () => {
    const text = serializeEnvelope(other, T0);
    expect(parseEnvelope(text)).toMatchObject({ ok: true });
  });
});

describe('export reminder', () => {
  const base = { createdAt: T0, lastExportAt: null, remindedAt: null, lastSavedAt: T0 + 20 * DAY };

  it('stays quiet during the first 14 days', () => {
    expect(shouldRemindExport({ ...base, now: T0 + 13 * DAY, lastSavedAt: T0 + 13 * DAY })).toBe(false);
  });

  it('reminds after 14 days without an export when the city progressed', () => {
    expect(shouldRemindExport({ ...base, now: T0 + 15 * DAY })).toBe(true);
  });

  it('counts from the last export', () => {
    expect(shouldRemindExport({ ...base, lastExportAt: T0 + 10 * DAY, now: T0 + 20 * DAY })).toBe(false);
    expect(shouldRemindExport({ ...base, lastExportAt: T0 + 2 * DAY, now: T0 + 20 * DAY })).toBe(true);
  });

  it('does not nag when nothing changed since the export', () => {
    expect(shouldRemindExport({ ...base, lastExportAt: T0 + 3 * DAY, lastSavedAt: T0 + 2 * DAY, now: T0 + 30 * DAY })).toBe(false);
  });

  it('waits another 14 days after being dismissed', () => {
    expect(shouldRemindExport({ ...base, remindedAt: T0 + 16 * DAY, now: T0 + 20 * DAY })).toBe(false);
    expect(shouldRemindExport({ ...base, remindedAt: T0 + 16 * DAY, now: T0 + 31 * DAY })).toBe(true);
  });

  it('remembers exports and the creation date in the meta record', () => {
    const store = new MemorySaveStore();
    expect(readMeta(store, T0)).toEqual({ createdAt: T0, lastExportAt: null, remindedAt: null });
    recordExport(store, T0 + DAY);
    expect(readMeta(store, T0 + 5 * DAY)).toEqual({ createdAt: T0, lastExportAt: T0 + DAY, remindedAt: null });
    expect(store.get(META_KEY)).not.toBeNull();
  });
});

describe('TabOwnership', () => {
  it('lets the last opened tab take over and warns the previous one', () => {
    const store = new MemorySaveStore();
    const events: string[] = [];
    const first = new TabOwnership(store, 'tab-1', { onLost: () => events.push('first lost'), onRegained: () => events.push('first regained') });
    first.claim();
    const second = new TabOwnership(store, 'tab-2', { onLost: () => events.push('second lost'), onRegained: () => {} });
    second.claim();
    first.handleStorageChange('urbtopia-owner');
    expect(events).toEqual(['first lost']);
    expect(first.isActive).toBe(false);
    expect(second.isActive).toBe(true);
  });

  it('ignores storage changes about other keys and its own claim', () => {
    const store = new MemorySaveStore();
    const events: string[] = [];
    const tab = new TabOwnership(store, 'tab-1', { onLost: () => events.push('lost'), onRegained: () => events.push('regained') });
    tab.claim();
    tab.handleStorageChange('something-else');
    tab.handleStorageChange('urbtopia-owner');
    expect(events).toEqual([]);
    expect(tab.isActive).toBe(true);
  });

  it('takes the ownership back when asked to resume', () => {
    const store = new MemorySaveStore();
    const events: string[] = [];
    const first = new TabOwnership(store, 'tab-1', { onLost: () => events.push('lost'), onRegained: () => events.push('regained') });
    first.claim();
    new TabOwnership(store, 'tab-2', { onLost: () => {}, onRegained: () => {} }).claim();
    first.handleStorageChange('urbtopia-owner');
    first.resume();
    expect(first.isActive).toBe(true);
    expect(events).toEqual(['lost', 'regained']);
  });
});
