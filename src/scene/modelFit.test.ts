import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { fitRailCorner } from './railModelFit';
import { fitMatrixOf } from './modelFit';

describe('fitMatrixOf', () => {
  it('leaves a model that already fits untouched', () => {
    expect(fitMatrixOf('commercial/building-a').equals(new THREE.Matrix4())).toBe(true);
  });
});

it('applies the scale of a managed model', () => {
  const fit = fitMatrixOf('holiday/bench');
  expect(new THREE.Vector3(1, 1, 1).applyMatrix4(fit).length()).toBeCloseTo(Math.sqrt(3) * 0.25);
});

it('fits the straight rails to tile boundaries while preserving a visible gauge', () => {
  const fit = fitMatrixOf('trains/railroad-straight');
  const start = new THREE.Vector3(0, -1, 0).applyMatrix4(fit);
  const end = new THREE.Vector3(0, -1, 4).applyMatrix4(fit);
  expect(start.toArray()).toEqual([0, 0, -.5]);
  expect(end.toArray()).toEqual([0, 0, .5]);
  expect(new THREE.Vector3(.5, -1, 2).applyMatrix4(fit).x).toBeCloseTo(.35);
});

it('fits the corner endpoints and gauge to adjoining straight rails', () => {
  const model = new THREE.Group();
  const geometry = new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, -2, 0, 2, .35, 0, 0], 3));
  const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial()); model.add(mesh);
  fitRailCorner(model);
  const positions = geometry.getAttribute('position');
  expect(positions.getX(0)).toBeCloseTo(0); expect(positions.getZ(0)).toBeCloseTo(-.5);
  expect(positions.getX(1)).toBeCloseTo(-.5); expect(positions.getZ(1)).toBeCloseTo(0);
  expect(positions.getX(2)).toBeCloseTo(.245);
});
