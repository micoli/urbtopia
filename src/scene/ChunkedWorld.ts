import * as THREE from 'three';
import { facilityScaleOf, fitMatrixOf } from './modelFit';
import type { ModelLibrary } from './modelLibrary';
import { isGlowingModel, withWindowGlow } from './windowGlow';
import { chunkKeyOf, type RenderItem, type TextureVariant } from './renderItems';
import type { SurfaceDisplay } from './levelDisplay';

// One flat translucent material for the whole Surface seen from an underground Level: no texture, no light, no shadow.
const GHOST_MATERIAL = new THREE.MeshBasicMaterial({ color: 0x9aa7b4, transparent: true, opacity: 0.22, depthWrite: false });

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
  private display: SurfaceDisplay = 'full';
  private objectShadows = false;

  constructor(private library: ModelLibrary, private chunkSize?: number) {}

  // Windows of an unpowered building stay dark at Night. Only the chunks that hold a changed building are rebuilt.
  setUnpowered(ids: ReadonlySet<number>): void {
    if (ids.size === this.unpowered.size && [...ids].every(id => this.unpowered.has(id))) return;
    this.unpowered = ids;
    const items = this.lastItems;
    this.lastItems = null;
    if (items) this.sync(items);
  }

  // Buildings always cast a shadow; the other models (trees, street furniture, scenery) only when this is on.
  setObjectShadows(enabled: boolean): void {
    if (enabled === this.objectShadows) return;
    this.objectShadows = enabled;
    this.rebuild();
  }

  // Drops every chunk so the next sync rebuilds them, for a change in the models' materials.
  rebuild(): void {
    for (const key of [...this.chunks.keys()]) this.removeChunk(key);
    const items = this.lastItems;
    this.lastItems = null;
    if (items) this.sync(items);
  }

  // Showing the Surface as a ghost rebuilds every chunk once with the flat material, and back.
  setDisplay(display: SurfaceDisplay): void {
    if (display === this.display) return;
    const rebuild = display === 'ghost' || this.display === 'ghost';
    this.display = display;
    this.root.visible = display !== 'hidden';
    if (!rebuild) return;
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
    const signature = `${this.display === 'ghost' ? 'ghost:' : ''}${items
      .map((item) => `${item.model}@${item.textureVariant ?? ''}#${item.tint ?? ''}${this.darkKey(item)}:${item.x},${item.z},${item.rotation},${item.elevation ?? 0},${item.roofBase ?? ''},${item.pitch ?? 0},${item.yaw ?? 0},${item.roll ?? 0},${item.lengthScale ?? 1},${item.scale ?? 1},${item.footprint ?? 0}`)
      .sort()
      .join('|')}`;
    if (this.chunks.get(key)?.signature === signature) return;
    this.removeChunk(key);
    const group = this.buildChunk(items);
    this.root.add(group);
    const bounds = new THREE.Sphere();
    for (const mesh of group.children) bounds.union((mesh as THREE.InstancedMesh).boundingSphere!);
    this.chunks.set(key, { signature, group, bounds });
  }

  // The building whose 3D model the ray hits first, if any: the ray goes through the instanced meshes, each instance knows its building.
  buildingIdAt(raycaster: THREE.Raycaster): number | null {
    if (!this.root.visible || this.display !== 'full') return null;
    const hits = raycaster.intersectObject(this.root, true);
    for (const hit of hits) {
      const ids = hit.object.userData.buildingIds as (number | undefined)[] | undefined;
      const id = hit.instanceId === undefined ? undefined : ids?.[hit.instanceId];
      if (id !== undefined) return id;
    }
    return null;
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
        const material = this.display === 'ghost' ? GHOST_MATERIAL : isGlowingModel(model) && !dark ? withWindowGlow(tinted) : tinted;
        const instanced = new THREE.InstancedMesh(mesh.geometry, material, modelItems.length);
        modelItems.forEach((item, index) => {
          const elevation = item.roofBase ? this.fittedBox(item.roofBase).max.y + (item.elevation ?? 0) : item.elevation ?? 0;
          placement.makeRotationY((item.rotation * Math.PI) / 2).setPosition(item.x, elevation, item.z);
          if (item.pitch || item.yaw || item.roll) placement.multiply(tilt.makeRotationFromEuler(new THREE.Euler(THREE.MathUtils.degToRad(item.pitch ?? 0), THREE.MathUtils.degToRad(item.yaw ?? 0), THREE.MathUtils.degToRad(item.roll ?? 0), 'YXZ')));
          combined.copy(placement).multiply(lengthScale.makeScale(item.scale ?? 1, item.scale ?? 1, (item.scale ?? 1) * (item.lengthScale ?? 1))).multiply(this.facilityScaleMatrix(item, facilityMatrix)).multiply(fit).multiply(mesh.matrixWorld);
          instanced.setMatrixAt(index, combined);
        });
        instanced.computeBoundingSphere();
        instanced.userData.buildingIds = modelItems.map((item) => item.buildingId);
        instanced.matrixAutoUpdate = false;
        instanced.castShadow = this.display === 'full' && (this.objectShadows || modelItems.some((item) => item.buildingId !== undefined && !item.object));
        instanced.receiveShadow = this.display === 'full';
        group.add(instanced);
      });
    }
    group.matrixAutoUpdate = false;
    return group;
  }
}
