import { describe, expect, it } from 'vitest';
import { rampColor } from './analyticsRamps';

describe('ramp colours', () => {
  it('starts and ends on the first and last stop', () => {
    expect(rampColor('heat', 0)).toBe(0xffe066);
    expect(rampColor('heat', 1)).toBe(0x7a1f3d);
  });

  it('clamps out-of-range shares', () => {
    expect(rampColor('heat', -3)).toBe(rampColor('heat', 0));
    expect(rampColor('heat', 9)).toBe(rampColor('heat', 1));
  });
});
