import { describe, expect, it } from 'vitest';
import { solarPanelPlacements, turnedOffset } from './solarPanelLayout';

describe('solarPanelPlacements', () => {
  it('puts one flat panel at the center of each tile by default', () => {
    expect(solarPanelPlacements(2, 1)).toEqual([
      { x: -0.5, y: 0, z: 0, rotationX: 0, rotationY: 0, rotationZ: 0 },
      { x: 0.5, y: 0, z: 0, rotationX: 0, rotationY: 0, rotationZ: 0 },
    ]);
    expect(solarPanelPlacements(3, 2)).toHaveLength(6);
  });
  it('places the listed panels individually, leaving the unset values at zero', () => {
    const [panel] = solarPanelPlacements(2, 2, [{ model: 'industrial-solar-panel-landscape', x: 0.4, z: -0.3, rotationX: 25, rotationZ: -10 }]);
    expect(panel).toEqual({ model: 'industrial-solar-panel-landscape', x: 0.4, y: 0, z: -0.3, rotationX: 25, rotationY: 0, rotationZ: -10 });
  });
});

describe('turnedOffset', () => {
  it('turns an offset a quarter turn at a time', () => {
    expect(turnedOffset(1, 0, 0)).toEqual({ x: 1, z: 0 });
    expect(turnedOffset(1, 0, 1)).toEqual({ x: 0, z: -1 });
    expect(turnedOffset(1, 0, 2)).toEqual({ x: -1, z: -0 });
  });
});
