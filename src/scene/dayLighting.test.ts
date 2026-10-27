import { describe, expect, it } from 'vitest';
import { lightingOf, mixColor } from './dayLighting';

describe('day lighting', () => {
  it('mixes colours channel by channel', () => {
    expect(mixColor(0x000000, 0xff8040, 0)).toBe(0x000000);
    expect(mixColor(0x000000, 0xff8040, 1)).toBe(0xff8040);
    expect(mixColor(0x000000, 0xff8040, 0.5)).toBe(0x804020);
  });

  it('keeps the original Daytime look', () => {
    const day = lightingOf(1);
    expect(day.sunColor).toBe(0xfff2d6);
    expect(day.sunIntensity).toBe(1.7);
    expect(day.background).toBe(0x9ec5e8);
    expect(day.hemisphereIntensity).toBe(0.5);
    expect(day.environmentIntensity).toBe(0.25);
  });

  it('never goes dark at Night: the sun keeps about 40% of the day intensity', () => {
    const night = lightingOf(0);
    expect(night.sunIntensity / lightingOf(1).sunIntensity).toBeGreaterThanOrEqual(0.4);
    expect(night.background).not.toBe(0);
    expect(night.hemisphereIntensity).toBeGreaterThan(0);
  });

  it('dims continuously between day and night', () => {
    const levels = Array.from({ length: 11 }, (_, step) => lightingOf(step / 10).sunIntensity);
    expect(levels).toEqual([...levels].sort((a, b) => a - b));
  });

  it('warms the sun during the fades only', () => {
    const plain = mixColor(lightingOf(0).sunColor, lightingOf(1).sunColor, 0.5);
    expect(lightingOf(0.5).sunColor).not.toBe(plain);
    expect(lightingOf(0.5).sunColor >> 16).toBeGreaterThan(plain >> 16);
    expect(lightingOf(1).sunColor).toBe(0xfff2d6);
    expect(lightingOf(0).sunColor).toBe(0x5a7bd6);
  });

  it('clamps out-of-range daylight', () => {
    expect(lightingOf(2)).toEqual(lightingOf(1));
    expect(lightingOf(-1)).toEqual(lightingOf(0));
  });
});
