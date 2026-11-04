import * as THREE from 'three';
import { fitMatrixOf } from './modelFit';
import type { ModelLibrary } from './modelLibrary';

export interface Placement {
  x: number;
  z: number;
  // Quarter turns, counter-clockwise seen from above, as the rotation of a building.
  rotation: number;
  color?: number;
}

// One Model drawn many times, one instanced mesh per sub-mesh of the model.
export class ModelInstances {
  readonly root = new THREE.Group();
  private parts: { mesh: THREE.InstancedMesh; base: THREE.Matrix4 }[] = [];
  private placement = new THREE.Matrix4();
  private color = new THREE.Color();

  constructor(private library: ModelLibrary, private model: string, private capacity: number) {}

  // Waits for the library to hold the model: until then nothing is drawn.
  update(placements: readonly Placement[]): void {
    this.build();
    const tiles = placements.slice(0, this.capacity);
    for (const { mesh, base } of this.parts) {
      tiles.forEach((tile, index) => {
        this.placement.makeRotationY((tile.rotation * Math.PI) / 2).setPosition(tile.x, 0, tile.z);
        mesh.setMatrixAt(index, this.placement.clone().multiply(base));
        mesh.setColorAt(index, this.color.setHex(tile.color ?? 0xffffff));
      });
      mesh.count = tiles.length;
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    }
  }

  dispose(): void {
    for (const { mesh } of this.parts) mesh.dispose();
  }

  private build(): void {
    if (this.parts.length > 0 || !this.library.has(this.model)) return;
    const fit = fitMatrixOf(this.model);
    const model = this.library.get(this.model);
    model.updateMatrixWorld(true);
    model.traverse((node) => {
      const source = node as THREE.Mesh;
      if (!source.isMesh) return;
      const mesh = new THREE.InstancedMesh(source.geometry, source.material, this.capacity);
      mesh.frustumCulled = false;
      mesh.count = 0;
      this.root.add(mesh);
      this.parts.push({ mesh, base: fit.clone().multiply(source.matrixWorld) });
    });
  }
}
