import { describe, expect, it } from 'vitest';
import { fitWithin } from './imageSizing';

describe('fitWithin', () => {
  it('keeps a small image', () => {
    expect(fitWithin(800, 600, 1280)).toEqual({ width: 800, height: 600 });
  });

  it('scales a wide image to the maximum width, keeping the ratio', () => {
    expect(fitWithin(2560, 1440, 1280)).toEqual({ width: 1280, height: 720 });
  });

  it('never returns a height of zero', () => {
    expect(fitWithin(10000, 1, 100).height).toBe(1);
  });
});
