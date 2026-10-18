import { describe, expect, it } from 'vitest';
import { stickCyclist, stickPedestrian } from './stickFigures';

describe('stick figures', () => {
  it('stands a pedestrian 0.3 tall on the ground, walking along the forward axis', () => {
    const geometry = stickPedestrian();
    geometry.computeBoundingBox();
    const box = geometry.boundingBox!;
    expect(box.min.y).toBeCloseTo(0, 2);
    expect(box.max.y).toBeCloseTo(0.3, 1);
    expect(box.max.z - box.min.z).toBeGreaterThan(box.max.x - box.min.x);
  });

  it('rides a cyclist on wheels resting on the ground, longer than wide', () => {
    const geometry = stickCyclist();
    geometry.computeBoundingBox();
    const box = geometry.boundingBox!;
    expect(box.min.y).toBeCloseTo(0, 1);
    expect(box.max.y).toBeCloseTo(0.27, 1);
    expect(box.max.z - box.min.z).toBeGreaterThan(0.35);
    expect(box.max.x - box.min.x).toBeLessThan(0.1);
  });
});
