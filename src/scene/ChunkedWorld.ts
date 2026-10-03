import * as THREE from 'three';
import { fitMatrixOf } from './modelFit';
import type { ModelLibrary } from './modelLibrary';
import { chunkKeyOf, type RenderItem } from './renderItems';

interface Chunk {
  signature: string;
  group: THREE.Group;
}

export class ChunkedWorld {
  readonly root = new THREE.Group();
  private chunks = new Map<string, Chunk>();
  private lastItems: RenderItem[] | null = null;

  constructor(private library: ModelLibrary) {}

  sync(items: RenderItem[]): void {
    if (items === this.lastItems) return;
    this.lastItems = items;
    const byChunk = new Map<string, RenderItem[]>();
    for (const item of items) {
      const key = chunkKeyOf(item.x, item.z);
      byChunk.set(key, [...(byChunk.get(key) ?? []), item]);
    }
    for (const key of [...this.chunks.keys()]) {
      if (!byChunk.has(key)) this.removeChunk(key);
    }
    for (const [key, chunkItems] of byChunk) this.syncChunk(key, chunkItems);
  }

  private syncChunk(key: string, items: RenderItem[]): void {
    const signature = items
      .map((item) => `${item.model}@${item.x},${item.z},${item.rotation},${item.elevation ?? 0},${item.roofBase ?? ''}`)
      .sort()
      .join('|');
    if (this.chunks.get(key)?.signature === signature) return;
    this.removeChunk(key);
    const group = this.buildChunk(items);
    this.root.add(group);
    this.chunks.set(key, { signature, group });
  }

  private removeChunk(key: string): void {
    const chunk = this.chunks.get(key);
    if (!chunk) return;
    this.root.remove(chunk.group);
    chunk.group.traverse((node) => {
      if ((node as THREE.InstancedMesh).isInstancedMesh) (node as THREE.InstancedMesh).dispose();
    });
    this.chunks.delete(key);
  }

  private buildChunk(items: RenderItem[]): THREE.Group {
    const group = new THREE.Group();
    const byModel = new Map<string, RenderItem[]>();
    for (const item of items) byModel.set(item.model, [...(byModel.get(item.model) ?? []), item]);

    const placement = new THREE.Matrix4();
    const combined = new THREE.Matrix4();
    for (const [model, modelItems] of byModel) {
      const fit = fitMatrixOf(model);
      this.library.get(model).traverse((node) => {
        const mesh = node as THREE.Mesh;
        if (!mesh.isMesh) return;
        const instanced = new THREE.InstancedMesh(mesh.geometry, mesh.material, modelItems.length);
        modelItems.forEach((item, index) => {
          const elevation = item.roofBase ? new THREE.Box3().setFromObject(this.library.get(item.roofBase)).applyMatrix4(fitMatrixOf(item.roofBase)).max.y : item.elevation ?? 0;
          placement.makeRotationY((item.rotation * Math.PI) / 2).setPosition(item.x, elevation, item.z);
          combined.multiplyMatrices(placement, fit).multiply(mesh.matrixWorld);
          instanced.setMatrixAt(index, combined);
        });
        instanced.computeBoundingSphere();
        group.add(instanced);
      });
    }
    return group;
  }
}
