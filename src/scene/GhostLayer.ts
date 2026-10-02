import * as THREE from 'three';
import type { GhostSpec } from '../tools/tools';

const VALID_COLOR = 0x35d07f;
const INVALID_COLOR = 0xe5484d;
const FRONT_ROTATION: Record<string, number> = { N: 0, W: Math.PI / 2, S: Math.PI, E: -Math.PI / 2 };

export class GhostLayer {
  readonly root = new THREE.Group();
  private tileGeometry = new THREE.PlaneGeometry(0.92, 0.92);
  private arrowGeometry = new THREE.ConeGeometry(0.28, 0.6, 3);
  private validMaterial = new THREE.MeshBasicMaterial({ color: VALID_COLOR, transparent: true, opacity: 0.6, depthTest: false });
  private invalidMaterial = new THREE.MeshBasicMaterial({ color: INVALID_COLOR, transparent: true, opacity: 0.6, depthTest: false });

  constructor() {
    this.root.renderOrder = 10;
  }

  set(ghost: GhostSpec | null): void {
    this.root.clear();
    if (!ghost) return;
    const material = ghost.valid ? this.validMaterial : this.invalidMaterial;
    for (const tile of ghost.tiles) {
      const mesh = new THREE.Mesh(this.tileGeometry, material);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.set(tile.x + 0.5, 0.06, tile.y + 0.5);
      mesh.renderOrder = 10;
      this.root.add(mesh);
    }
    if (!ghost.front) return;
    const arrow = new THREE.Mesh(this.arrowGeometry, material);
    arrow.rotation.x = -Math.PI / 2;
    arrow.rotation.z = FRONT_ROTATION[ghost.front.direction] ?? 0;
    arrow.position.set(ghost.front.x, 0.3, ghost.front.z);
    arrow.renderOrder = 11;
    this.root.add(arrow);
  }

  dispose(): void {
    this.root.clear();
    this.tileGeometry.dispose();
    this.arrowGeometry.dispose();
    this.validMaterial.dispose();
    this.invalidMaterial.dispose();
  }
}
