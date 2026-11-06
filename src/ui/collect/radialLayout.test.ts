import { describe, expect, it } from 'vitest';
import { BADGE_SIZE, PREVIEW_SIZE, radialIconSize, radialOffsets } from './radialLayout';

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
    expect(gap).toBeGreaterThan(radialIconSize(6) * 0.5);
    expect(gap).toBeLessThan(radialIconSize(6) * 0.8);
  });

  it('keeps a single icon at full size', () => {
    expect(radialIconSize(1)).toBe(PREVIEW_SIZE);
  });

  it('shrinks the icons as they multiply and keeps them inside the badge', () => {
    expect(radialIconSize(6)).toBeLessThan(radialIconSize(2));
    for (const count of [2, 3, 4, 6, 8]) {
      const reach = Math.max(...radialOffsets(count).map(({ x, y }) => Math.hypot(x, y))) + radialIconSize(count) / 2;
      expect(reach).toBeLessThanOrEqual(BADGE_SIZE / 2);
    }
  });
});
