import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AFTER_HARVEST_MS, harvestEffects } from './harvestEffects';

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  vi.useRealTimers();
  harvestEffects.setState({ tiles: [] });
});

describe('harvest effects', () => {
  it('keeps harvested tiles for the after-harvest stage, then clears them', () => {
    harvestEffects.getState().show([{ x: 1, y: 2, species: 'wheat' }]);
    expect(harvestEffects.getState().tiles).toEqual([{ x: 1, y: 2, species: 'wheat' }]);
    vi.advanceTimersByTime(AFTER_HARVEST_MS - 1);
    expect(harvestEffects.getState().tiles).toHaveLength(1);
    vi.advanceTimersByTime(1);
    expect(harvestEffects.getState().tiles).toEqual([]);
  });

  it('expires each sweep on its own schedule', () => {
    harvestEffects.getState().show([{ x: 1, y: 2, species: 'wheat' }]);
    vi.advanceTimersByTime(AFTER_HARVEST_MS / 2);
    harvestEffects.getState().show([{ x: 3, y: 2, species: 'corn' }]);
    vi.advanceTimersByTime(AFTER_HARVEST_MS / 2);
    expect(harvestEffects.getState().tiles).toEqual([{ x: 3, y: 2, species: 'corn' }]);
  });
});
