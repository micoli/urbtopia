import { describe, expect, it } from 'vitest';
import { advance, createBuilding, dayCycleOffsetAt, ECOLOGY, energyStats, newGame, productionFactors, type GameState } from '../index';

const H = ECOLOGY.hourMs;
const CYCLE_HOUR = H / 12;

const solarCity = (cycleHour: number): GameState => ({
  ...newGame({ seed: 'day-cycle', now: 0 }), dayCycleOffset: dayCycleOffsetAt(0, cycleHour), tutorial: null, adaptationUntil: 0,
  buildings: [createBuilding(100, 'solar', 40, 40, 0)],
});

describe('energy and the Day cycle', () => {
  it('produces solar power only in Daytime, with a peak of 1 at the middle', () => {
    const solar = (cycleHour: number) => productionFactors(0, cycleHour * CYCLE_HOUR).solar;
    expect([0, 3, 5, 22, 23].map(solar)).toEqual([0, 0, 0, 0, 0]);
    expect(solar(6)).toBeGreaterThan(0);
    expect(solar(21)).toBeGreaterThan(0);
    expect(Math.max(...Array.from({ length: 24 }, (_, hour) => solar(hour)))).toBeCloseTo(1, 1);
  });

  it('gives no solar output at Night and some at noon', () => {
    expect(energyStats(solarCity(2)).solar).toBe(0);
    expect(energyStats(solarCity(14)).solar).toBeGreaterThan(0);
  });

  it('keeps the wind on the real hours, whatever the Day cycle', () => {
    expect(productionFactors(3 * H, 0).wind).toBe(productionFactors(3 * H, 7 * CYCLE_HOUR).wind);
  });

  it('replays the same whether advanced at once or in steps', () => {
    const start = solarCity(10);
    const once = advance(start, 3 * H).state;
    const stepped = [H, 2 * H, 3 * H].reduce((state, now) => advance(state, now).state, start);
    expect(stepped.lastSeen).toBe(once.lastSeen);
    expect(stepped.urbs).toBeCloseTo(once.urbs);
  });
});
