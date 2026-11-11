import { describe, expect, it, vi } from 'vitest';
import { advance, GAME_CONFIG } from '../core';
import { buildIdealCity } from '../saves/idealCity';
import { catchUpInChunks } from './catchUpInChunks';
import { createGameStore } from './gameStore';

vi.hoisted(() => vi.stubGlobal('window', { location: { search: '' } }));

const HOUR_MS = 3_600_000;

describe('catchUpInChunks', () => {
  it('reaches the same city as one replay of the same absence', async () => {
    const city = buildIdealCity();
    const now = city.lastSeen + 5 * HOUR_MS;
    const store = createGameStore(city);
    await catchUpInChunks(now, store);
    const whole = advance(city, now).state;
    expect(store.getState().state.lastSeen).toBeGreaterThanOrEqual(now);
    expect(store.getState().state.urbs).toBeCloseTo(whole.urbs, -2);
  });

  it('gives the browser back between hours', async () => {
    const city = buildIdealCity();
    const store = createGameStore(city);
    let ticks = 0;
    const timer = setInterval(() => { ticks += 1; }, 0);
    await catchUpInChunks(city.lastSeen + 4 * HOUR_MS, store);
    clearInterval(timer);
    expect(ticks).toBeGreaterThan(0);
  });

  it('forfeits what lies beyond the offline cap, as one replay does', async () => {
    const city = buildIdealCity();
    const now = city.lastSeen + GAME_CONFIG.offlineCapMs + 6 * HOUR_MS;
    const store = createGameStore(city);
    await catchUpInChunks(now, store);
    const whole = advance(city, now).state;
    expect(store.getState().state.timeOffset).toBe(whole.timeOffset);
    expect(store.getState().state.urbs).toBeCloseTo(whole.urbs, -2);
  }, 120000);

  it('ignores a call while a replay runs', async () => {
    const city = buildIdealCity();
    const now = city.lastSeen + 3 * HOUR_MS;
    const store = createGameStore(city);
    const first = catchUpInChunks(now, store);
    await catchUpInChunks(now, store);
    await first;
    expect(store.getState().state.lastSeen).toBeGreaterThanOrEqual(now);
  });
});
