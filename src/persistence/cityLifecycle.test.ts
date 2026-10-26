import { describe, expect, it, vi } from 'vitest';
import { dispatch, newGame } from '../core';
import { bootCities, FIRST_CITY_ID, readRegistry } from './cities';
import { createCityLifecycle, type CityLifecycleDeps } from './cityLifecycle';
import { CityScopedSaveStore } from './cityStore';
import { serializeEnvelope } from './envelope';
import { MemorySaveStore, SAVE_KEY } from './saveStore';

const T0 = 1_700_000_000_000;

function setup(overrides: Partial<CityLifecycleDeps> = {}) {
  const raw = new MemorySaveStore();
  bootCities(raw, T0);
  let ids = 0;
  const flush = vi.fn();
  const lockSaves = vi.fn();
  const reload = vi.fn();
  const deps = {
    raw,
    openCityId: () => FIRST_CITY_ID,
    now: () => T0,
    newCityId: () => `c${(ids += 1)}`,
    tutorial: () => false,
    flush,
    lockSaves,
    reload,
    wait: () => new Promise<void>(() => {}),
    hasWaitingShipment: () => false,
    deleteCloudCity: vi.fn(async () => true),
    ...overrides,
  } satisfies CityLifecycleDeps;
  return { raw, deps, flush, lockSaves, reload, lifecycle: createCityLifecycle(deps) };
}

describe('City lifecycle', () => {
  it('flushes the open City, makes the new one the next to open and reloads', () => {
    const { raw, flush, reload, lifecycle } = setup();
    expect(lifecycle.create('easy')).toBe(true);
    expect(flush).toHaveBeenCalled();
    expect(readRegistry(raw)?.lastPlayed).toBe('c1');
    expect(reload).toHaveBeenCalledOnce();
  });

  it('refuses a fourth City without reloading', () => {
    const { reload, lifecycle } = setup();
    lifecycle.create('cozy');
    lifecycle.create('cozy');
    reload.mockClear();
    expect(lifecycle.create('cozy')).toBe(false);
    expect(reload).not.toHaveBeenCalled();
  });

  it('switches to another City after flushing, and does nothing for the open one', () => {
    const { raw, reload, lifecycle } = setup();
    lifecycle.create('cozy');
    reload.mockClear();
    lifecycle.open(FIRST_CITY_ID);
    expect(reload).not.toHaveBeenCalled();
    lifecycle.open('c1');
    expect(readRegistry(raw)?.lastPlayed).toBe('c1');
    expect(reload).toHaveBeenCalledOnce();
  });

  it('deletes a closed City locally at once and reports the online copy later', async () => {
    const { raw, deps, lifecycle } = setup({ deleteCloudCity: vi.fn(async () => false) });
    lifecycle.create('cozy');
    const outcome = await lifecycle.remove('c1');
    expect(outcome.kind).toBe('deleted');
    expect(readRegistry(raw)?.cities.map((city) => city.id)).toEqual([FIRST_CITY_ID]);
    expect(deps.deleteCloudCity).toHaveBeenCalledWith('c1');
    expect(outcome.kind === 'deleted' && (await outcome.cloudDeleted)).toBe(false);
  });

  it('locks saving and reloads when the open City is deleted', async () => {
    const { raw, deps, reload, lockSaves, lifecycle } = setup({ wait: () => Promise.resolve() });
    lifecycle.create('cozy');
    const open = createCityLifecycle({ ...deps, openCityId: () => 'c1' });
    reload.mockClear();
    const outcome = await open.remove('c1');
    expect(outcome.kind).toBe('deleted');
    expect(lockSaves).toHaveBeenCalledOnce();
    expect(reload).toHaveBeenCalledOnce();
    expect(readRegistry(raw)?.lastPlayed).toBe(FIRST_CITY_ID);
  });

  it('refuses the last City without locking saves', async () => {
    const { reload, lockSaves, lifecycle } = setup();
    expect(await lifecycle.remove(FIRST_CITY_ID)).toEqual({ kind: 'refused', reason: 'last-city' });
    expect(lockSaves).not.toHaveBeenCalled();
    expect(reload).not.toHaveBeenCalled();
  });

  it('refuses to delete a City with an accepted Challenge and lists why', async () => {
    const { raw, lifecycle } = setup();
    lifecycle.create('cozy');
    const started = dispatch(newGame({ seed: 'amber-fox-4821', now: T0 }), { type: 'ChallengeStart', id: 'c1', goal: [{ item: 'wood', quantity: 5 }], deadline: T0 + 1000 }, T0);
    if (!started.ok) throw new Error(started.error.key);
    new CityScopedSaveStore(raw, () => 'c1').put(SAVE_KEY, serializeEnvelope(started.state, T0));
    expect(await lifecycle.remove('c1')).toEqual({ kind: 'blocked', blockers: ['challenge'] });
    expect(readRegistry(raw)?.cities).toHaveLength(2);
  });

  it('refuses to delete a City that has a Shipment waiting, sent or received', async () => {
    const { raw, lifecycle } = setup({ hasWaitingShipment: (cityId) => cityId === 'c1' });
    lifecycle.create('cozy');
    expect(await lifecycle.remove('c1')).toEqual({ kind: 'blocked', blockers: ['shipment'] });
    expect(readRegistry(raw)?.cities).toHaveLength(2);
  });
});
