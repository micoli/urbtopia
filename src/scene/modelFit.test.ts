import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { fitMatrixOf } from './modelFit';

describe('fitMatrixOf', () => {
  it('leaves a model that already fits untouched', () => {
    expect(fitMatrixOf('commercial/building-a').equals(new THREE.Matrix4())).toBe(true);
  });

  it('centres the workshop on its 2x2 footprint without overflowing it', () => {
    const fit = fitMatrixOf('industrial/building-h');
    const corners = [new THREE.Vector3(-1.24, 0, -0.38), new THREE.Vector3(0.08, 0, 0.93)].map((corner) => corner.applyMatrix4(fit));
    const [min, max] = corners as [THREE.Vector3, THREE.Vector3];
    expect((min.x + max.x) / 2).toBeCloseTo(0, 1);
    expect((min.z + max.z) / 2).toBeCloseTo(0, 1);
    expect(max.x - min.x).toBeLessThanOrEqual(2);
    expect(max.x - min.x).toBeGreaterThan(1.8);
    expect(max.z - min.z).toBeLessThanOrEqual(2);
    expect(max.z - min.z).toBeGreaterThan(1.8);
  });
});
