import { describe, expect, it } from 'vitest';
import { DEVICE_ID_KEY, readDeviceId } from './deviceId';
import { MemorySaveStore } from './saveStore';

describe('readDeviceId', () => {
  it('creates an id once and keeps it', () => {
    const store = new MemorySaveStore();
    expect(readDeviceId(store, () => 'first')).toBe('first');
    expect(readDeviceId(store, () => 'second')).toBe('first');
  });

  it('replaces an empty id', () => {
    const store = new MemorySaveStore();
    store.put(DEVICE_ID_KEY, '');
    expect(readDeviceId(store, () => 'fresh')).toBe('fresh');
  });
});
