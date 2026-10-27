import { describe, expect, it } from 'vitest';
import { DAY_CYCLE, timeOfCycleHour } from '../core';
import { WINDOW_SCHEDULE, cellOf, nightClockOf, windowHash, windowLitAt, type NightClock, type WindowCell } from './windowSchedule';

const cells: WindowCell[] = Array.from({ length: 4000 }, (_, index) => ({ x: index % 40, y: Math.floor(index / 400), z: Math.floor(index / 40) % 10 }));
const clock = (sinceDusk: number, nightIndex = 0): NightClock => ({ sinceDusk, nightIndex });
const litShare = (at: NightClock) => cells.filter(cell => windowLitAt(cell, at)).length / cells.length;

describe('window schedule', () => {
  it('draws the same hash for the same window and night, and another one for another night', () => {
    const cell = { x: 3, y: 1, z: 7 };
    expect(windowHash(cell, 5)).toBe(windowHash(cell, 5));
    expect(windowHash(cell, 5)).not.toBe(windowHash(cell, 6));
    expect(windowHash(cell, 5)).not.toBe(windowHash({ ...cell, x: 4 }, 5));
  });

  it('keeps the hash in 32 unsigned bits', () => {
    for (const cell of cells.slice(0, 200)) {
      const hash = windowHash(cell, 123456);
      expect(Number.isInteger(hash) && hash >= 0 && hash < 2 ** 32).toBe(true);
    }
  });

  it('lights no window in Daytime and at dawn', () => {
    expect(litShare(clock(-1))).toBe(0);
    expect(nightClockOf(timeOfCycleHour(12)).sinceDusk).toBe(-1);
    expect(nightClockOf(timeOfCycleHour(5.5)).sinceDusk).toBe(WINDOW_SCHEDULE.nightHours - 0.5);
    expect(nightClockOf(timeOfCycleHour(6)).sinceDusk).toBe(-1);
  });

  it('leaves about 40% of the windows dark all night', () => {
    const everLit = cells.filter(cell => Array.from({ length: 80 }, (_, step) => step * 0.1).some(since => windowLitAt(cell, clock(since)))).length / cells.length;
    expect(everLit).toBeGreaterThan(0.5);
    expect(everLit).toBeLessThan(0.7);
  });

  it('switches on between 22:00 and 00:30 and off between 00:30 and 05:30', () => {
    const lit = (since: number) => litShare(clock(since));
    expect(lit(0)).toBeLessThan(lit(2.4));
    expect(lit(2.4)).toBeGreaterThan(0.3);
    expect(lit(2.6)).toBeGreaterThan(0.3);
    expect(lit(5)).toBeLessThan(lit(2.6));
    expect(lit(7.4)).toBeLessThan(0.1);
    expect(lit(7.6)).toBe(0);
  });

  it('keeps one night number from 22:00 to 06:00 and changes it the next night', () => {
    const cycle = DAY_CYCLE.durationMs;
    const dusk = nightClockOf(timeOfCycleHour(22.2));
    expect(nightClockOf(timeOfCycleHour(23.9)).nightIndex).toBe(dusk.nightIndex);
    expect(nightClockOf(cycle + timeOfCycleHour(1)).nightIndex).toBe(dusk.nightIndex);
    expect(nightClockOf(cycle + timeOfCycleHour(5.9)).nightIndex).toBe(dusk.nightIndex);
    expect(nightClockOf(cycle + timeOfCycleHour(22.2)).nightIndex).toBe(dusk.nightIndex + 1);
  });

  it('turns a world position into the cell of its window', () => {
    expect(cellOf(0.1, 0.1, 0.1)).toEqual({ x: 0, y: 0, z: 0 });
    expect(cellOf(1.2, 0.7, 2.6)).toEqual({ x: 2, y: 2, z: 5 });
  });
});
