import * as THREE from 'three';
import { facilityScaleOf, fitMatrixOf } from './modelFit';
import type { ModelLibrary } from './modelLibrary';
import { isGlowingModel, withWindowGlow } from './windowGlow';
import { chunkKeyOf, type RenderItem, type TextureVariant } from './renderItems';

interface Chunk {
  signature: string;
  group: THREE.Group;
  bounds: THREE.Sphere;
}

const viewProjection = new THREE.Matrix4();
const frustum = new THREE.Frustum();

export class ChunkedWorld {
  readonly root = new THREE.Group();
  private chunks = new Map<string, Chunk>();
  private lastItems: RenderItem[] | null = null;
  private fittedBoxes = new Map<string, THREE.Box3>();
  private unpowered: ReadonlySet<number> = new Set();

  constructor(private library: ModelLibrary, private chunkSize?: number) {}

  // Windows of an unpowered building stay dark at Night. Only the chunks that hold a changed building are rebuilt.
  setUnpowered(ids: ReadonlySet<number>): void {
    if (ids.size === this.unpowered.size && [...ids].every(id => this.unpowered.has(id))) return;
    this.unpowered = ids;
    const items = this.lastItems;
    this.lastItems = null;
    if (items) this.sync(items);
  }

  private darkKey(item: RenderItem): string {
    return item.buildingId !== undefined && this.unpowered.has(item.buildingId) ? '!' : '';
  }

  sync(items: RenderItem[]): void {
    if (items === this.lastItems) return;
    this.lastItems = items;
    const byChunk = new Map<string, RenderItem[]>();
    for (const item of items) {
      const key = chunkKeyOf(item.x, item.z, this.chunkSize);
      const chunkItems = byChunk.get(key);
      if (chunkItems) chunkItems.push(item);
      else byChunk.set(key, [item]);
    }
    for (const key of [...this.chunks.keys()]) {
      if (!byChunk.has(key)) this.removeChunk(key);
    }
    for (const [key, chunkItems] of byChunk) this.syncChunk(key, chunkItems);
  }

  private syncChunk(key: string, items: RenderItem[]): void {
    const signature = items
      .map((item) => `${item.model}@${item.textureVariant ?? ''}#${item.tint ?? ''}${this.darkKey(item)}:${item.x},${item.z},${item.rotation},${item.elevation ?? 0},${item.roofBase ?? ''},${item.pitch ?? 0},${item.yaw ?? 0},${item.roll ?? 0},${item.lengthScale ?? 1},${item.scale ?? 1},${item.footprint ?? 0}`)
      .sort()
      .join('|');
    if (this.chunks.get(key)?.signature === signature) return;
    this.removeChunk(key);
    const group = this.buildChunk(items);
    this.root.add(group);
    const bounds = new THREE.Sphere();
    for (const mesh of group.children) bounds.union((mesh as THREE.InstancedMesh).boundingSphere!);
    this.chunks.set(key, { signature, group, bounds });
  }

  // A City has thousands of instanced meshes: hiding a whole chunk spares three.js from testing each of them every frame.
  cull(camera: THREE.Camera): void {
    camera.updateMatrixWorld();
    frustum.setFromProjectionMatrix(viewProjection.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse));
    for (const { group, bounds } of this.chunks.values()) group.visible = frustum.intersectsSphere(bounds);
  }

  private facilityScaleMatrix(item: RenderItem, target: THREE.Matrix4): THREE.Matrix4 {
    if (!item.footprint || !item.fitModel) return target.identity();
    const { horizontal, vertical } = facilityScaleOf(this.fittedBox(item.fitModel), item.footprint);
    return target.makeScale(horizontal, vertical, horizontal);
  }

  private fittedBox(model: string): THREE.Box3 {
    const cached = this.fittedBoxes.get(model);
    if (cached) return cached;
    const box = new THREE.Box3().setFromObject(this.library.get(model)).applyMatrix4(fitMatrixOf(model));
    this.fittedBoxes.set(model, box);
    return box;
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
      const key = `${item.model}@${item.textureVariant ?? ''}#${item.tint ?? ''}${this.darkKey(item)}`;
      const modelItems = byModel.get(key);
      if (modelItems) modelItems.push(item);
      else byModel.set(key, [item]);
    }

    const placement = new THREE.Matrix4();
    const tilt = new THREE.Matrix4();
    const lengthScale = new THREE.Matrix4();
    const facilityMatrix = new THREE.Matrix4();
    const combined = new THREE.Matrix4();
    for (const [key, modelItems] of byModel) {
      const dark = key.endsWith('!');
      const plainKey = dark ? key.slice(0, -1) : key;
      const separator = plainKey.lastIndexOf('@');
      const model = plainKey.slice(0, separator);
      const [variant = '', tint = ''] = plainKey.slice(separator + 1).split('#');
      const fit = fitMatrixOf(model);
      this.library.get(model).traverse((node) => {
        const mesh = node as THREE.Mesh;
        if (!mesh.isMesh) return;
        const textured = variant ? this.library.withTextureVariant(mesh.material, variant as TextureVariant) : mesh.material;
        const tinted = tint ? this.library.withTint(textured, Number(tint)) : textured;
        const instanced = new THREE.InstancedMesh(mesh.geometry, isGlowingModel(model) && !dark ? withWindowGlow(tinted) : tinted, modelItems.length);
        modelItems.forEach((item, index) => {
          const elevation = item.roofBase ? this.fittedBox(item.roofBase).max.y + (item.elevation ?? 0) : item.elevation ?? 0;
          placement.makeRotationY((item.rotation * Math.PI) / 2).setPosition(item.x, elevation, item.z);
          if (item.pitch || item.yaw || item.roll) placement.multiply(tilt.makeRotationFromEuler(new THREE.Euler(THREE.MathUtils.degToRad(item.pitch ?? 0), THREE.MathUtils.degToRad(item.yaw ?? 0), THREE.MathUtils.degToRad(item.roll ?? 0), 'YXZ')));
          combined.copy(placement).multiply(lengthScale.makeScale(item.scale ?? 1, item.scale ?? 1, (item.scale ?? 1) * (item.lengthScale ?? 1))).multiply(this.facilityScaleMatrix(item, facilityMatrix)).multiply(fit).multiply(mesh.matrixWorld);
          instanced.setMatrixAt(index, combined);
        });
        instanced.computeBoundingSphere();
        instanced.matrixAutoUpdate = false;
        group.add(instanced);
      });
    }
    group.matrixAutoUpdate = false;
    return group;
  }
}
