import * as THREE from 'three';
import { homeTintsOf, layerFieldsOf, type AnalyticsLayerId, type GameState, type HomeTint, type LayerField, type ServiceCategory } from '../core';
import { rampColor } from './analyticsRamps';

const REFRESH_MS = 5000;
const LAYOUT_REFRESH_MS = 500;

export class AnalyticsLayer {
  readonly root = new THREE.Group();
  private tileGeometry = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
  private material = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6, depthTest: false, depthWrite: false, toneMapped: false });
  private layout = '';
  private layer: AnalyticsLayerId | null = null;
  private category: ServiceCategory | null = null;
  private builtAt = 0;

  constructor() {
    this.root.name = 'analytics-layer';
    this.root.renderOrder = 6;
    this.root.visible = false;
  }

  sync(state: GameState, layer: AnalyticsLayerId | null, category: ServiceCategory, now = performance.now()): void {
    if (!layer) {
      this.layer = null;
      this.root.visible = false;
      return;
    }
    const layout = `${state.buildings.length}:${state.roads.length}:${state.pedestrianWays?.length ?? 0}`;
    const elapsed = now - this.builtAt;
    const sameView = this.layer === layer && this.category === category;
    if (sameView && (elapsed < LAYOUT_REFRESH_MS || (layout === this.layout && elapsed < REFRESH_MS))) return;
    this.layer = layer;
    this.category = category;
    this.layout = layout;
    this.builtAt = now;
    this.clearMeshes();
    const fields = layerFieldsOf(state, layer);
    const tints = homeTintsOf(state, layer, category);
    this.root.visible = fields.length > 0 || tints.length > 0;
    fields.forEach((field, index) => this.addField(field, `analytics-${layer}-${index}`, 6 + index * 0.1));
    this.addHomeTints(tints, `analytics-${layer}-homes`);
  }

  private addHomeTints(tints: readonly HomeTint[], name: string): void {
    if (!tints.length) return;
    const mesh = new THREE.InstancedMesh(this.tileGeometry, this.material, tints.length);
    mesh.name = name;
    mesh.renderOrder = 6;
    const matrix = new THREE.Matrix4();
    const color = new THREE.Color();
    tints.forEach((tint, instance) => {
      matrix.makeScale(tint.width - 0.08, 1, tint.depth - 0.08).setPosition(tint.x + tint.width / 2, 0.1, tint.y + tint.depth / 2);
      mesh.setMatrixAt(instance, matrix);
      mesh.setColorAt(instance, color.setHex(rampColor(tint.ramp, tint.share)));
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    this.root.add(mesh);
  }

  private addField({ field, ramp }: LayerField, name: string, renderOrder: number): void {
    const tiles: number[] = [];
    field.values.forEach((value, index) => {
      if (value > 0) tiles.push(index);
    });
    if (!tiles.length) return;
    const mesh = new THREE.InstancedMesh(this.tileGeometry, this.material, tiles.length);
    mesh.name = name;
    mesh.renderOrder = renderOrder;
    const matrix = new THREE.Matrix4();
    const color = new THREE.Color();
    tiles.forEach((index, instance) => {
      matrix.makeScale(0.96, 1, 0.96).setPosition((index % field.size) + 0.5, 0.09, Math.floor(index / field.size) + 0.5);
      mesh.setMatrixAt(instance, matrix);
      mesh.setColorAt(instance, color.setHex(rampColor(ramp, field.values[index]! / field.max)));
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    this.root.add(mesh);
  }

  private clearMeshes(): void {
    for (const child of [...this.root.children]) {
      if (!(child instanceof THREE.InstancedMesh)) continue;
      this.root.remove(child);
      child.dispose();
    }
  }

  dispose(): void {
    this.clearMeshes();
    this.tileGeometry.dispose();
    this.material.dispose();
    this.root.clear();
  }
}
