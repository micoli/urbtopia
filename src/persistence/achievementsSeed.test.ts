import { describe, expect, it } from 'vitest';
import { newGame } from '../core';
import { parseEnvelope, serializeEnvelope } from './envelope';
import saveV21 from './fixtures/save-v21.json';
import saveV5 from './fixtures/save-v5.json';
import { SaveSession } from './saveSession';
import { MemorySaveStore } from './saveStore';
import { SAVE_KEY } from './saveStore';

describe('Achievements of a save made before they existed', () => {
  it('seeds the ones the state proves and leaves the others to do', () => {
    const loaded = parseEnvelope(JSON.stringify(saveV21));
    if (!loaded.ok) throw new Error(loaded.reason);
    expect(loaded.state.achievements).toEqual(['housing.firstHome', 'housing.school', 'transport.firstRoad']);
  });

  it('seeds an Achievement of a mode only from a line of that mode', () => {
    const loaded = parseEnvelope(JSON.stringify(saveV5));
    if (!loaded.ok) throw new Error(loaded.reason);
    expect(loaded.state.achievements).toEqual(['transport.railwayLine']);
  });

  it('seeds once: a save that already has Achievements keeps them as they are', () => {
    const city = { ...newGame({ seed: 'seeded', now: 0 }), achievements: [] };
    const loaded = parseEnvelope(serializeEnvelope(city, 0));
    expect(loaded.ok && loaded.state.achievements).toEqual([]);
  });

  it('tells the session how many were seeded, only for an older save', () => {
    const store = new MemorySaveStore();
    store.put(SAVE_KEY, JSON.stringify(saveV21));
    expect(new SaveSession(store).load()).toMatchObject({ kind: 'loaded', seededAchievements: 3 });
    store.put(SAVE_KEY, serializeEnvelope({ ...newGame({ seed: 'new', now: 0 }), achievements: [] }, 0));
    expect(new SaveSession(store).load()).toMatchObject({ kind: 'loaded', seededAchievements: 0 });
  });
});
