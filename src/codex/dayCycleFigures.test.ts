import { describe, expect, it } from 'vitest';
import { DAY_CYCLE, ECOLOGY, newGame } from '../core';
import { dayCycleFigures } from './dayCycleFigures';

const state = (offset: number) => ({ ...newGame({ seed: 'day-cycle-figures', now: 0 }), dayCycleOffset: offset });

describe('dayCycleFigures', () => {
  it('reads the length of the cycle from the Day cycle definition', () => {
    const figures = dayCycleFigures(state(0));
    expect(figures.durationHours).toBe(2);
    expect(figures.cycleHourMinutes).toBe(5);
    expect(figures.daytimeHours + figures.nightHours).toBe(DAY_CYCLE.cycleHours);
    expect(figures.hours).toHaveLength(DAY_CYCLE.cycleHours);
  });

  it('gives no solar power at Night and a full output in the middle of Daytime', () => {
    const { hours } = dayCycleFigures(state(0));
    expect(hours.filter(({ phase }) => phase === 'night' || phase === 'dawn' || phase === 'dusk').every(({ solar }) => solar === 0)).toBe(true);
    expect(Math.max(...hours.map(({ solar }) => solar))).toBeCloseTo(1, 1);
  });

  it('keeps water power between its minimum and its full output', () => {
    for (const { hydro } of dayCycleFigures(state(0)).hours) {
      expect(hydro).toBeGreaterThanOrEqual(ECOLOGY.hydroMinFactor);
      expect(hydro).toBeLessThanOrEqual(1);
    }
  });

  it('shows the moment of the city clock', () => {
    const atNoon = state(12 * DAY_CYCLE.durationMs / DAY_CYCLE.cycleHours);
    expect(dayCycleFigures(atNoon).current).toEqual({ hour: 12, phase: 'daytime' });
  });
});
