import { afterEach, describe, expect, it, vi } from 'vitest';
import { ANALYTICS_CATEGORY_KEY, ANALYTICS_LAYER_KEY, readAnalyticsCategory, readAnalyticsLayer, writeAnalyticsCategory, writeAnalyticsLayer } from './analyticsLayerPref';

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

  it('round-trips a Service category and falls back to the first one', () => {
    stubStorage();
    expect(readAnalyticsCategory()).toBe('education');
    writeAnalyticsCategory('health');
    expect(readAnalyticsCategory()).toBe('health');
    stubStorage({ [ANALYTICS_CATEGORY_KEY]: 'nope' });
    expect(readAnalyticsCategory()).toBe('education');
  });
});
