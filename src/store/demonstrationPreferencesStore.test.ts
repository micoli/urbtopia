import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';

const key = 'urbtopia-demonstration-preferences';
let storage: Map<string, string>;
const load = async () => (await import('./demonstrationPreferencesStore')).demonstrationPreferencesStore;

beforeEach(() => {
  vi.resetModules();
  storage = new Map();
  vi.stubGlobal('localStorage', {
    getItem: (name: string) => storage.get(name) ?? null,
    setItem: (name: string, value: string) => storage.set(name, value),
  });
});
afterEach(() => vi.unstubAllGlobals());

describe('demonstration invitation preferences', () => {
  it('remembers viewed demonstrations by interior type after reload', async () => {
    const store = await load();
    store.getState().markSeen('factory');
    store.getState().markSeen('factory');
    expect(store.getState().seenTypes).toEqual(['factory']);
    expect(store.getState().seenTypes).not.toContain('bakery');
    vi.resetModules();
    expect((await load()).getState().seenTypes).toEqual(['factory']);
  });

  it('disables invitations only for the chosen interior type after reload', async () => {
    const store = await load();
    store.getState().hideInvitation('bakery');
    store.getState().hideInvitation('bakery');
    expect(store.getState().hiddenTypes).toEqual(['bakery']);
    expect(store.getState().seenTypes).toEqual([]);
    vi.resetModules();
    expect((await load()).getState().hiddenTypes).toEqual(['bakery']);
    expect((await load()).getState().hiddenTypes).not.toContain('factory');
  });

  it.each(['invalid', 'null', '[]', '{"seenTypes":false,"hiddenTypes":"factory"}'])('handles invalid stored preferences: %s', async raw => {
    storage.set(key, raw);
    const store = await load();
    expect(store.getState().seenTypes).toEqual([]);
    expect(store.getState().hiddenTypes).toEqual([]);
  });

  it('filters invalid entries and preserves both preferences', async () => {
    storage.set(key, JSON.stringify({ seenTypes: ['factory', null, 42], hiddenTypes: [false, 'bakery'] }));
    const store = await load();
    store.getState().markSeen('workshop');
    expect(JSON.parse(storage.get(key)!)).toEqual({ seenTypes: ['factory', 'workshop'], hiddenTypes: ['bakery'] });
  });

  it('keeps working when storage is unavailable', async () => {
    vi.stubGlobal('localStorage', {
      getItem: () => { throw new Error('blocked'); },
      setItem: () => { throw new Error('blocked'); },
    });
    const store = await load();
    store.getState().markSeen('factory');
    store.getState().hideInvitation('bakery');
    expect(store.getState().seenTypes).toEqual(['factory']);
    expect(store.getState().hiddenTypes).toEqual(['bakery']);
  });
});
