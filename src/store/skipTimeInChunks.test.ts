import { describe, expect, it, vi } from 'vitest';
import { buildIdealCity } from '../saves/idealCity';
import { createGameStore } from './gameStore';
import { skipTimeInChunks } from './skipTimeInChunks';

vi.hoisted(() => vi.stubGlobal('window', { location: { search: '' } }));

const HOUR_MS = 3_600_000;

describe('skipTimeInChunks', () => {
  it('reaches the same city as one skip of the same length', async () => {
    const city = buildIdealCity();
    const whole = createGameStore(city);
    const chunked = createGameStore(city);
    whole.getState().send({ type: 'SkipTime', hours: 3 });
    await skipTimeInChunks(3, chunked);
    expect(chunked.getState().state.timeOffset).toBe(whole.getState().state.timeOffset);
    expect(chunked.getState().state.urbs).toBeCloseTo(whole.getState().state.urbs, -2);
  });

  it('gives the browser back between chunks', async () => {
    const store = createGameStore(buildIdealCity());
    let ticks = 0;
    const timer = setInterval(() => { ticks += 1; }, 0);
    await skipTimeInChunks(4, store);
    clearInterval(timer);
    expect(ticks).toBeGreaterThan(0);
    expect(store.getState().state.timeOffset).toBe((buildIdealCity().timeOffset ?? 0) + 4 * HOUR_MS);
  });

  it('ignores a second skip while one is running', async () => {
    const store = createGameStore(buildIdealCity());
    const first = skipTimeInChunks(2, store);
    await skipTimeInChunks(2, store);
    await first;
    expect(store.getState().state.timeOffset).toBe((buildIdealCity().timeOffset ?? 0) + 2 * HOUR_MS);
  });
});
