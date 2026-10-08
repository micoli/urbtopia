import { describe, expect, it } from 'vitest';
import { ZOOM, clampPan, maxPan, nextZoom } from './venueZoom';

describe('Venue zoom', () => {
  it('zooms in when the wheel turns away, and out when it turns toward the user', () => {
    expect(nextZoom(1, -100)).toBeGreaterThan(1);
    expect(nextZoom(1, 100)).toBeLessThan(1);
    expect(nextZoom(1.5, 0)).toBe(1.5);
  });

  it('stays within its limits', () => {
    let zoom = 1;
    for (let turn = 0; turn < 100; turn++) zoom = nextZoom(zoom, -120);
    expect(zoom).toBe(ZOOM.max);
    for (let turn = 0; turn < 100; turn++) zoom = nextZoom(zoom, 120);
    expect(zoom).toBe(ZOOM.min);
  });

  it('takes a bounded step for a long swipe', () => {
    expect(nextZoom(1, -100000)).toBeLessThanOrEqual(Math.exp(ZOOM.maxStep) + 1e-9);
    expect(nextZoom(1, 100000)).toBeGreaterThanOrEqual(Math.exp(-ZOOM.maxStep) - 1e-9);
  });

  it('comes back to the same zoom after the opposite turn', () => {
    expect(nextZoom(nextZoom(1.2, -80), 80)).toBeCloseTo(1.2, 9);
  });

  it('lets the view move only when it is zoomed in', () => {
    expect(maxPan(1, 6)).toBe(0);
    expect(maxPan(0.8, 6)).toBe(0);
    expect(maxPan(3, 6)).toBeGreaterThan(maxPan(2, 6));
    expect(clampPan({ x: 5, z: -5 }, 1, 6)).toEqual({ x: 0, z: 0 });
    const limit = maxPan(2, 6);
    expect(clampPan({ x: 99, z: -99 }, 2, 6)).toEqual({ x: limit, z: -limit });
    expect(clampPan({ x: 0.5, z: -0.5 }, 3, 6)).toEqual({ x: 0.5, z: -0.5 });
  });
});
