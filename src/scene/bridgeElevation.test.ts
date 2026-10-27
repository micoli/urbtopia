import { describe, expect, it } from 'vitest';
import { BRIDGE_CLEARANCE, bridgeElevation, bridgePitch } from './bridgeElevation';

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

  it('pitches the nose up on the way up, down on the way down, and stays level elsewhere', () => {
    const pitch = (x: number, yaw: number) => bridgePitch(elevation, x, 50.5, yaw, ramp, farRamp);
    expect(pitch(52.5, Math.PI / 2)).toBeLessThan(0);
    expect(pitch(52.5, -Math.PI / 2)).toBeGreaterThan(0);
    expect(pitch(54.5, Math.PI / 2)).toBeCloseTo(0);
    expect(pitch(56.5, Math.PI / 2)).toBeGreaterThan(0);
    expect(bridgePitch(elevation, 40.5, 50.5, Math.PI / 2, { x: 40, y: 50 }, { x: 41, y: 50 })).toBeCloseTo(0);
  });

  it('follows a vertical Bridge', () => {
    expect(bridgeElevation([{ x: 60, y: 50, length: 1, axis: 'y', carrier: 'brt' }])(60.5, 50.5, { x: 60, y: 49 }, { x: 60, y: 51 })).toBe(BRIDGE_CLEARANCE);
  });
});


describe('bridgeElevation over a Footbridge', () => {
  const elevation = bridgeElevation([{ x: 50, y: 50, length: 2, axis: 'x', carrier: 'pedestrian', side: 1 }]);
  const corridor = { x: 49, y: 51 };
  const stair = { x: 49, y: 50 };
  const deck = { x: 50, y: 50 };

  it('is on the ground at the corridor and half way up at the landing of the stair', () => {
    expect(elevation(49.5, 51.5, corridor, corridor)).toBe(0);
    expect(elevation(49.5, 50.5, stair, stair)).toBeCloseTo(BRIDGE_CLEARANCE / 2);
  });

  it('climbs from the corridor to the landing, then from the landing to the deck', () => {
    expect(elevation(49.5, 51, corridor, stair)).toBeCloseTo(BRIDGE_CLEARANCE / 4);
    expect(elevation(50, 50.5, stair, deck)).toBeCloseTo((BRIDGE_CLEARANCE * 3) / 4);
    expect(elevation(50.5, 50.5, deck, deck)).toBe(BRIDGE_CLEARANCE);
  });

  it('is the same walking back down', () => {
    expect(elevation(50, 50.5, deck, stair)).toBeCloseTo((BRIDGE_CLEARANCE * 3) / 4);
  });

  it('stays level over the deck and leaves the Road beneath on the ground', () => {
    expect(elevation(51, 50.5, { x: 50, y: 50 }, { x: 51, y: 50 })).toBe(BRIDGE_CLEARANCE);
    expect(elevation(50.5, 50.5, { x: 50, y: 49 }, { x: 50, y: 51 })).toBe(0);
  });
});
