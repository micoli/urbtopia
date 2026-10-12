import { describe, expect, it } from 'vitest';
import { solarPanelLayout } from './solarPanelLayout';

describe('solarPanelLayout', () => {
  it('puts one panel at the center of each tile by default', () => {
    expect(solarPanelLayout(2, 1)).toEqual([{ x: -0.5, z: 0, scale: 1 }, { x: 0.5, z: 0, scale: 1 }]);
    expect(solarPanelLayout(3, 2)).toHaveLength(6);
  });
  it('shows the requested count, shrinking panels once they outnumber the tiles', () => {
    expect(solarPanelLayout(2, 2, 1)).toEqual([{ x: 0, z: 0, scale: 1 }]);
    const crowded = solarPanelLayout(1, 1, 4);
    expect(crowded).toHaveLength(4);
    expect(crowded.every(slot => slot.scale === 0.5)).toBe(true);
  });
  it('keeps every panel inside the footprint', () => {
    for (const count of [1, 2, 3, 5, 7, 12]) {
      for (const slot of solarPanelLayout(3, 2, count)) {
        expect(Math.abs(slot.x)).toBeLessThanOrEqual(1.5);
        expect(Math.abs(slot.z)).toBeLessThanOrEqual(1);
      }
    }
  });
});
