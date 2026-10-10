import { describe, expect, it } from 'vitest';
import { PREVIEW_SIZE, radialBadgeSize, radialOffsets } from './radialLayout';

describe('radial layout of ready items', () => {
  it('centres a single item', () => {
    const [only] = radialOffsets(1);
    expect(only!.x).toBeCloseTo(0);
    expect(only!.y).toBeCloseTo(0);
  });

  it('starts at the top and keeps every item around the centre', () => {
    const offsets = radialOffsets(4);
    expect(offsets[0]!.x).toBeCloseTo(0);
    expect(offsets[0]!.y).toBeLessThan(0);
    expect(offsets.reduce((sum, offset) => sum + offset.x, 0)).toBeCloseTo(0);
    expect(offsets.reduce((sum, offset) => sum + offset.y, 0)).toBeCloseTo(0);
  });

  it('keeps neighbours distinct yet packed', () => {
    const [first, second] = radialOffsets(6);
    const gap = Math.hypot(first!.x - second!.x, first!.y - second!.y);
    expect(gap).toBeGreaterThan(PREVIEW_SIZE * 0.5);
    expect(gap).toBeLessThan(PREVIEW_SIZE * 0.8);
  });

  it('grows the badge with the item count', () => {
    expect(radialBadgeSize(6)).toBeGreaterThan(radialBadgeSize(2));
  });
});
