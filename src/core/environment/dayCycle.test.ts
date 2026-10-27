import { describe, expect, it } from 'vitest';
import { DAY_CYCLE, cycleHourOf, cycleTimeOf, dayCycleOffsetAt, daylightOf, isDaytime, phaseOf } from './dayCycle';

const CYCLE_HOUR = DAY_CYCLE.durationMs / 24;
const at = (hour: number) => hour * CYCLE_HOUR;

describe('Day cycle', () => {
  it('lasts 2 real hours and wraps, including before the epoch', () => {
    expect(cycleHourOf(0)).toBe(0);
    expect(cycleHourOf(at(13))).toBe(13);
    expect(cycleHourOf(DAY_CYCLE.durationMs + at(7))).toBe(7);
    expect(cycleHourOf(-at(1))).toBe(23);
  });

  it('has 16 Cycle hours of Daytime from 06:00 to 22:00 and 8 of Night', () => {
    const hours = Array.from({ length: 24 }, (_, hour) => isDaytime(at(hour)));
    expect(hours.filter(Boolean)).toHaveLength(16);
    expect(isDaytime(at(6))).toBe(true);
    expect(isDaytime(at(22) - 1)).toBe(true);
    expect(isDaytime(at(22))).toBe(false);
    expect(isDaytime(at(6) - 1)).toBe(false);
  });

  it('puts dawn and dusk inside the Night, one Cycle hour each', () => {
    expect(phaseOf(at(4.99))).toBe('night');
    expect(phaseOf(at(5))).toBe('dawn');
    expect(phaseOf(at(6))).toBe('daytime');
    expect(phaseOf(at(22))).toBe('dusk');
    expect(phaseOf(at(23))).toBe('night');
  });

  it('fades the light continuously between 0 and 1', () => {
    expect(daylightOf(at(12))).toBe(1);
    expect(daylightOf(at(2))).toBe(0);
    expect(daylightOf(at(5))).toBe(0);
    expect(daylightOf(at(6))).toBe(1);
    expect(daylightOf(at(5.5))).toBeCloseTo(0.5);
    expect(daylightOf(at(22))).toBe(1);
    expect(daylightOf(at(23))).toBe(0);
    expect(daylightOf(at(22.5))).toBeCloseTo(0.5);
    expect(daylightOf(at(5) - 1)).toBe(0);
    expect(daylightOf(at(23) - 1)).toBeCloseTo(0, 5);
  });

  it('follows the Time skip and the City offset', () => {
    expect(cycleTimeOf({}, 1000)).toBe(1000);
    expect(cycleTimeOf({ timeOffset: 5, dayCycleOffset: 7 }, 1000)).toBe(1012);
    const skipped = cycleHourOf(cycleTimeOf({ timeOffset: 3_600_000 }, at(3)));
    expect(skipped).toBe(15);
  });

  it('starts a City at 06:00 whatever the real time', () => {
    for (const now of [0, 123_456_789, 1_700_000_000_000, -5_000_000]) {
      expect(cycleHourOf(now + dayCycleOffsetAt(now))).toBeCloseTo(DAY_CYCLE.startHour, 6);
    }
  });
});
