import * as THREE from 'three';
import { facilityScaleOf, fitMatrixOf } from './modelFit';
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
      .map((item) => `${item.model}@${item.textureVariant ?? ''}#${item.tint ?? ''}:${item.x},${item.z},${item.rotation},${item.elevation ?? 0},${item.roofBase ?? ''},${item.lengthScale ?? 1},${item.footprint ?? 0}`)
      .sort()
      .join('|');
    if (this.chunks.get(key)?.signature === signature) return;
    this.removeChunk(key);
    const group = this.buildChunk(items);
    this.root.add(group);
    this.chunks.set(key, { signature, group });
  }

  private facilityScaleMatrix(item: RenderItem, target: THREE.Matrix4): THREE.Matrix4 {
    if (!item.footprint || !item.fitModel) return target.identity();
    const box = new THREE.Box3().setFromObject(this.library.get(item.fitModel)).applyMatrix4(fitMatrixOf(item.fitModel));
    const { horizontal, vertical } = facilityScaleOf(box, item.footprint);
    return target.makeScale(horizontal, vertical, horizontal);
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
    for (const item of items) {
      const key = `${item.model}@${item.textureVariant ?? ''}#${item.tint ?? ''}`;
      byModel.set(key, [...(byModel.get(key) ?? []), item]);
    }

    const placement = new THREE.Matrix4();
    const lengthScale = new THREE.Matrix4();
    const facilityMatrix = new THREE.Matrix4();
    const combined = new THREE.Matrix4();
    for (const [key, modelItems] of byModel) {
      const separator = key.lastIndexOf('@');
      const model = key.slice(0, separator);
      const [variant = '', tint = ''] = key.slice(separator + 1).split('#');
      const fit = fitMatrixOf(model);
      this.library.get(model).traverse((node) => {
        const mesh = node as THREE.Mesh;
        if (!mesh.isMesh) return;
        const textured = variant ? this.library.withTextureVariant(mesh.material, variant as 'a' | 'b' | 'c') : mesh.material;
        const material = tint ? this.library.withTint(textured, Number(tint)) : textured;
        const instanced = new THREE.InstancedMesh(mesh.geometry, material, modelItems.length);
        modelItems.forEach((item, index) => {
          const elevation = item.roofBase ? new THREE.Box3().setFromObject(this.library.get(item.roofBase)).applyMatrix4(fitMatrixOf(item.roofBase)).max.y : item.elevation ?? 0;
          placement.makeRotationY((item.rotation * Math.PI) / 2).setPosition(item.x, elevation, item.z);
          combined.copy(placement).multiply(lengthScale.makeScale(1, 1, item.lengthScale ?? 1)).multiply(this.facilityScaleMatrix(item, facilityMatrix)).multiply(fit).multiply(mesh.matrixWorld);
          instanced.setMatrixAt(index, combined);
        });
        instanced.computeBoundingSphere();
        group.add(instanced);
      });
    }
    return group;
  }
}
