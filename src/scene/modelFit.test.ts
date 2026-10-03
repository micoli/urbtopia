import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { fitRailCorner } from './railModelFit';
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

it('fits Kenney straight rails to tile boundaries while preserving a visible gauge', () => {
  const fit = fitMatrixOf('trains/railroad-straight');
  const start = new THREE.Vector3(0, -1, 0).applyMatrix4(fit);
  const end = new THREE.Vector3(0, -1, 4).applyMatrix4(fit);
  expect(start.toArray()).toEqual([0, 0, -.5]);
  expect(end.toArray()).toEqual([0, 0, .5]);
  expect(new THREE.Vector3(.5, -1, 2).applyMatrix4(fit).x).toBeCloseTo(.35);
});

it('fits Kenney corner endpoints and gauge to adjoining straight rails', () => {
  const model = new THREE.Group();
  const geometry = new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, -2, 0, 2, .35, 0, 0], 3));
  const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial()); model.add(mesh);
  fitRailCorner(model);
  const positions = geometry.getAttribute('position');
  expect(positions.getX(0)).toBeCloseTo(0); expect(positions.getZ(0)).toBeCloseTo(-.5);
  expect(positions.getX(1)).toBeCloseTo(-.5); expect(positions.getZ(1)).toBeCloseTo(0);
  expect(positions.getX(2)).toBeCloseTo(.245);
});
