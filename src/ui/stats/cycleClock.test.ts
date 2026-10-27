import { describe, expect, it } from 'vitest';
import { DAY_CYCLE, timeOfCycleHour } from '../../core';
import { cycleClockOf } from './cycleClock';

describe('cycleClockOf', () => {
  it('shows the Cycle hour as hh:mm with the icon of the phase', () => {
    expect(cycleClockOf(timeOfCycleHour(14.5))).toMatchObject({ time: '14:30', phase: 'daytime', icon: '☀️' });
    expect(cycleClockOf(timeOfCycleHour(5.25))).toMatchObject({ time: '05:15', phase: 'dawn' });
    expect(cycleClockOf(timeOfCycleHour(22))).toMatchObject({ time: '22:00', phase: 'dusk' });
    expect(cycleClockOf(timeOfCycleHour(2))).toMatchObject({ time: '02:00', phase: 'night', icon: '🌙' });
  });

  it('wraps after one Day cycle', () => {
    expect(cycleClockOf(DAY_CYCLE.durationMs).time).toBe('00:00');
    expect(cycleClockOf(-1).time).toBe('23:59');
  });
});
