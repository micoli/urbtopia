import { afterEach, describe, expect, it, vi } from 'vitest';
import { DEMONSTRATION_SPEED_KEY, readDemonstrationSpeed, writeDemonstrationSpeed } from './useDemonstrationSpeed';

function stubStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  vi.stubGlobal('localStorage', { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => void data.set(key, value) });
  return data;
}

describe('demonstration speed preference', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('starts at normal speed', () => {
    stubStorage();
    expect(readDemonstrationSpeed()).toBe(1);
  });

  it('round-trips a speed', () => {
    stubStorage();
    writeDemonstrationSpeed(2);
    expect(readDemonstrationSpeed()).toBe(2);
  });

  it('ignores a stored value that is not an offered speed', () => {
    stubStorage({ [DEMONSTRATION_SPEED_KEY]: '7' });
    expect(readDemonstrationSpeed()).toBe(1);
  });

  it('survives unavailable storage', () => {
    vi.stubGlobal('localStorage', { getItem: () => { throw new Error('blocked'); }, setItem: () => { throw new Error('blocked'); } });
    expect(readDemonstrationSpeed()).toBe(1);
    expect(() => writeDemonstrationSpeed(2)).not.toThrow();
  });
});
