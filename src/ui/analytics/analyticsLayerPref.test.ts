import { afterEach, describe, expect, it, vi } from 'vitest';
import { ANALYTICS_LAYER_KEY, readAnalyticsLayer, writeAnalyticsLayer } from './analyticsLayerPref';

function stubStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  vi.stubGlobal('localStorage', { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => void data.set(key, value) });
  return data;
}

describe('analytics layer preference', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('round-trips a layer', () => {
    stubStorage();
    writeAnalyticsLayer('data.pollution');
    expect(readAnalyticsLayer()).toBe('data.pollution');
  });

  it('ignores an unknown stored value', () => {
    stubStorage({ [ANALYTICS_LAYER_KEY]: 'data.nope' });
    expect(readAnalyticsLayer()).toBeNull();
  });

  it('survives unavailable storage', () => {
    vi.stubGlobal('localStorage', { getItem: () => { throw new Error('blocked'); }, setItem: () => { throw new Error('blocked'); } });
    expect(readAnalyticsLayer()).toBeNull();
    expect(() => writeAnalyticsLayer('data.odor')).not.toThrow();
  });
});
