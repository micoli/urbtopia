import { describe, expect, it } from 'vitest';
import { BRIDGE_CLEARANCE, bridgeElevation } from './bridgeElevation';

describe('bridgeElevation', () => {
  const elevation = bridgeElevation([{ x: 53, y: 50, length: 3, axis: 'x', carrier: 'road' }]);

  it('is flat away from a Bridge over infrastructure, and for a Bridge over Water', () => {
    expect(elevation(40.5, 50.5)).toBe(0);
    expect(elevation(54.5, 52.5)).toBe(0);
    expect(bridgeElevation([{ x: 53, y: 50, length: 3, axis: 'x' }])(54.5, 50.5)).toBe(0);
  });

  it('rises over the first ramp, stays level over the span and falls over the last ramp', () => {
    expect(elevation(52, 50.5)).toBe(0);
    expect(elevation(52.5, 50.5)).toBeCloseTo(BRIDGE_CLEARANCE / 2);
    expect(elevation(53, 50.5)).toBe(BRIDGE_CLEARANCE);
    expect(elevation(54.5, 50.5)).toBe(BRIDGE_CLEARANCE);
    expect(elevation(56.5, 50.5)).toBeCloseTo(BRIDGE_CLEARANCE / 2);
    expect(elevation(57, 50.5)).toBe(0);
  });

  it('follows a vertical Bridge', () => {
    expect(bridgeElevation([{ x: 60, y: 50, length: 1, axis: 'y', carrier: 'brt' }])(60.5, 50.5)).toBe(BRIDGE_CLEARANCE);
  });
});
