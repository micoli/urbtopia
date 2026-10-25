import * as THREE from 'three';
import { congestionStats, type CongestionStats, type GameState } from '../core';
import { dividerStrips } from './congestionMarkers';

const MARKER_HEIGHT = 0.04;
const CROSS_LENGTH = 0.7;
const CROSS_WIDTH = 0.1;
const DIVIDER_LENGTH = 0.9;
const DIVIDER_WIDTH = 0.025;

export class CongestionLayer {
  readonly root = new THREE.Group();
  private stats: CongestionStats | null = null;
  private roads: GameState['roads'] | null = null;
  private meshes: THREE.InstancedMesh[] = [];
  private flat = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
  private crossMaterial = new THREE.MeshBasicMaterial({ color: 0xd62828, polygonOffset: true, polygonOffsetFactor: -4 });
  private dividerMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, polygonOffset: true, polygonOffsetFactor: -3 });
  private placement = new THREE.Object3D();

  sync(state: GameState): void {
    const stats = congestionStats(state);
    if (stats === this.stats && state.roads === this.roads) return;
    this.stats = stats;
    this.roads = state.roads;
    this.clear();
    this.addCrosses(stats);
    this.addDividers(state);
  }

  dispose(): void {
    this.clear();
    this.flat.dispose();
    this.crossMaterial.dispose();
    this.dividerMaterial.dispose();
  }

  private clear(): void {
    for (const mesh of this.meshes) {
      this.root.remove(mesh);
      mesh.dispose();
    }
    this.meshes = [];
  }

  private addCrosses(stats: CongestionStats): void {
    const tiles = stats.disconnectedSections.flat();
    if (tiles.length === 0) return;
    for (const angle of [Math.PI / 4, -Math.PI / 4]) {
      const mesh = this.makeMesh(this.crossMaterial, tiles.length);
      tiles.forEach((tile, index) => this.place(mesh, index, tile.x + 0.5, MARKER_HEIGHT, tile.y + 0.5, angle, CROSS_LENGTH, CROSS_WIDTH));
      this.finish(mesh);
    }
  }

  private addDividers(state: GameState): void {
    const strips = dividerStrips(state);
    if (strips.length === 0) return;
    const mesh = this.makeMesh(this.dividerMaterial, strips.length);
    strips.forEach((strip, index) => {
      const x = strip.horizontal ? strip.x : strip.x + strip.offset;
      const z = strip.horizontal ? strip.z + strip.offset : strip.z;
      this.place(mesh, index, x, MARKER_HEIGHT, z, 0, strip.horizontal ? DIVIDER_LENGTH : DIVIDER_WIDTH, strip.horizontal ? DIVIDER_WIDTH : DIVIDER_LENGTH);
    });
    this.finish(mesh);
  }

  private makeMesh(material: THREE.Material, count: number): THREE.InstancedMesh {
    const mesh = new THREE.InstancedMesh(this.flat, material, count);
    mesh.frustumCulled = false;
    this.meshes.push(mesh);
    this.root.add(mesh);
    return mesh;
  }

  private place(mesh: THREE.InstancedMesh, index: number, x: number, y: number, z: number, yaw: number, scaleX: number, scaleZ: number): void {
    this.placement.position.set(x, y, z);
    this.placement.rotation.set(0, yaw, 0);
    this.placement.scale.set(scaleX, 1, scaleZ);
    this.placement.updateMatrix();
    mesh.setMatrixAt(index, this.placement.matrix);
  }

  private finish(mesh: THREE.InstancedMesh): void {
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }
}
