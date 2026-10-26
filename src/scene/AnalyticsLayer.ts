import * as THREE from 'three';
import { layerFieldsOf, type AnalyticsLayerId, type GameState, type LayerField } from '../core';
import { rampColor } from './analyticsRamps';

const REFRESH_MS = 2000;

export class AnalyticsLayer {
  readonly root = new THREE.Group();
  private tileGeometry = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
  private material = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6, depthTest: false, depthWrite: false, toneMapped: false });
  private buildings: GameState['buildings'] | null = null;
  private layer: AnalyticsLayerId | null = null;
  private builtAt = 0;

  constructor() {
    this.root.name = 'analytics-layer';
    this.root.renderOrder = 6;
    this.root.visible = false;
  }

  sync(state: GameState, layer: AnalyticsLayerId | null, now = performance.now()): void {
    if (!layer) {
      this.layer = null;
      this.root.visible = false;
      return;
    }
    const unchanged = this.layer === layer && this.buildings === state.buildings && now - this.builtAt < REFRESH_MS;
    if (unchanged) return;
    this.layer = layer;
    this.buildings = state.buildings;
    this.builtAt = now;
    this.clearMeshes();
    const fields = layerFieldsOf(state, layer);
    this.root.visible = fields.length > 0;
    fields.forEach((field, index) => this.addField(field, `analytics-${layer}-${index}`, 6 + index * 0.1));
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
