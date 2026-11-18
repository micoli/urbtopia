import { describe, expect, it } from 'vitest';
import { floatingMenuArc } from './floatingMenuArc';

describe('floatingMenuArc', () => {
  it('puts a single button straight below', () => {
    expect(floatingMenuArc(1)).toEqual([{ x: 0, y: 44 }]);
  });

  it('spreads the buttons symmetrically, the middle one straight below', () => {
    const arc = floatingMenuArc(3);
    expect(arc[1]!.x).toBe(0);
    expect(arc[0]!.x).toBe(-arc[2]!.x);
    expect(arc[0]!.y).toBe(arc[2]!.y);
    expect(arc[1]!.y).toBeGreaterThan(arc[0]!.y);
  });

  it('keeps every button around or under the centre and leaves a gap between two', () => {
    for (const count of [2, 3, 4, 5, 7]) {
      const arc = floatingMenuArc(count);
      expect(arc.every(offset => offset.y >= -28)).toBe(true);
      for (let index = 1; index < arc.length; index += 1) expect(Math.hypot(arc[index]!.x - arc[index - 1]!.x, arc[index]!.y - arc[index - 1]!.y)).toBeGreaterThanOrEqual(56);
    }
  });

  it('stays within the lower half of the circle, on a reasonable span', () => {
    const arc = floatingMenuArc(7);
    const radius = Math.hypot(arc[0]!.x, arc[0]!.y + 28);
    expect(Math.abs(Math.atan2(arc[0]!.x, arc[0]!.y + 28)) * 180 / Math.PI).toBeLessThanOrEqual(90);
    expect(radius).toBeGreaterThan(0);
  });

  it('gives nothing for no button', () => {
    expect(floatingMenuArc(0)).toEqual([]);
  });
});
