import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { ChunkedWorld } from './ChunkedWorld';
import type { ModelLibrary } from './modelLibrary';
import type { RenderItem } from './renderItems';

const cube = (): THREE.Object3D => {
  const group = new THREE.Group();
  group.add(new THREE.Mesh(new THREE.BoxGeometry(1, 3, 1).translate(0, 1.5, 0), new THREE.MeshBasicMaterial()));
  return group;
};
const library = { get: cube, withTextureVariant: (material: THREE.Material) => material, withTint: (material: THREE.Material) => material } as unknown as ModelLibrary;
const item = (buildingId: number | undefined, x: number, z: number): RenderItem => ({ model: 'cube', x, z, rotation: 0, buildingId }) as RenderItem;

const rayFrom = (x: number, z: number, y = 10): THREE.Raycaster => new THREE.Raycaster(new THREE.Vector3(x, y, z), new THREE.Vector3(0, -1, 0));

describe('ChunkedWorld picking', () => {
  it('finds the building whose model the ray hits, and ignores what has no building', () => {
    const world = new ChunkedWorld(library);
    world.sync([item(7, 0, 0), item(8, 5, 0), item(undefined, 10, 0)]);
    world.root.updateMatrixWorld(true);
    expect(world.buildingIdAt(rayFrom(0, 0))).toBe(7);
    expect(world.buildingIdAt(rayFrom(5, 0))).toBe(8);
    expect(world.buildingIdAt(rayFrom(10, 0))).toBeNull();
    expect(world.buildingIdAt(rayFrom(20, 0))).toBeNull();
  });

  it('picks the high part of a model, where the ground tile behind it belongs to another building', () => {
    const world = new ChunkedWorld(library);
    world.sync([item(7, 0, 0)]);
    world.root.updateMatrixWorld(true);
    const slanted = new THREE.Raycaster(new THREE.Vector3(0, 3.5, -4), new THREE.Vector3(0, -0.3, 1).normalize());
    expect(world.buildingIdAt(slanted)).toBe(7);
  });

  it('picks nothing when the Surface is hidden', () => {
    const world = new ChunkedWorld(library);
    world.sync([item(7, 0, 0)]);
    world.setDisplay('hidden');
    expect(world.buildingIdAt(rayFrom(0, 0))).toBeNull();
  });
});
