import { describe, expect, it } from 'vitest';
import { BRIDGE_CLEARANCE, bridgeElevation } from './bridgeElevation';

describe('bridgeElevation', () => {
  const elevation = bridgeElevation([{ x: 53, y: 50, length: 3, axis: 'x', carrier: 'road' }]);
  const ramp = { x: 52, y: 50 };
  const farRamp = { x: 56, y: 50 };

  it('is flat away from a Bridge over infrastructure, and for a Bridge over Water', () => {
    expect(elevation(40.5, 50.5, { x: 40, y: 50 }, { x: 41, y: 50 })).toBe(0);
    expect(bridgeElevation([{ x: 53, y: 50, length: 3, axis: 'x' }])(54.5, 50.5, ramp, farRamp)).toBe(0);
  });

  it('rises over the first ramp, stays level over the span and falls over the last ramp', () => {
    expect(elevation(52, 50.5, ramp, farRamp)).toBe(0);
    expect(elevation(52.5, 50.5, ramp, farRamp)).toBeCloseTo(BRIDGE_CLEARANCE / 2);
    expect(elevation(53, 50.5, ramp, farRamp)).toBe(BRIDGE_CLEARANCE);
    expect(elevation(54.5, 50.5, ramp, farRamp)).toBe(BRIDGE_CLEARANCE);
    expect(elevation(56.5, 50.5, ramp, farRamp)).toBeCloseTo(BRIDGE_CLEARANCE / 2);
    expect(elevation(57, 50.5, ramp, farRamp)).toBe(0);
  });

  it('keeps what drives beneath the span on the ground', () => {
    expect(elevation(54.5, 50.5, { x: 54, y: 49 }, { x: 54, y: 51 })).toBe(0);
  });

  it('follows a vertical Bridge', () => {
    expect(bridgeElevation([{ x: 60, y: 50, length: 1, axis: 'y', carrier: 'brt' }])(60.5, 50.5, { x: 60, y: 49 }, { x: 60, y: 51 })).toBe(BRIDGE_CLEARANCE);
  });
});
