import * as THREE from 'three';
import type { GhostSpec } from '../tools/tools';

const VALID_COLOR = 0x35d07f;
const INVALID_COLOR = 0xe5484d;
const HINT_COLOR = 0xffd23f;
const RANGE_COLOR = 0x4da3ff;
const FRONT_ROTATION: Record<string, number> = { N: 0, W: Math.PI / 2, S: Math.PI, E: -Math.PI / 2 };

export class GhostLayer {
  readonly root = new THREE.Group();
  private tileGeometry = new THREE.PlaneGeometry(0.92, 0.92);
  private arrowGeometry = new THREE.ConeGeometry(0.28, 0.6, 3);
  private validMaterial = new THREE.MeshBasicMaterial({ color: VALID_COLOR, transparent: true, opacity: 0.6, depthTest: false });
  private hintMaterial = new THREE.MeshBasicMaterial({ color: HINT_COLOR, transparent: true, opacity: 0.25, depthTest: false });
  private rangeMaterial = new THREE.MeshBasicMaterial({ color: RANGE_COLOR, transparent: true, opacity: 0.2, depthTest: false });
  private invalidMaterial = new THREE.MeshBasicMaterial({ color: INVALID_COLOR, transparent: true, opacity: 0.6, depthTest: false });

  constructor(validColor = VALID_COLOR, { underBuildings = false } = {}) {
    this.validMaterial.color.set(validColor);
    this.validMaterial.depthTest = underBuildings;
    this.root.renderOrder = 10;
  }

  set(ghost: GhostSpec | null): void {
    this.disposeChildren();
    if (!ghost) return;
    const material = ghost.valid ? this.validMaterial : this.invalidMaterial;
    for (const rect of ghost.rects) {
      const plane = new THREE.Mesh(new THREE.PlaneGeometry(rect.width - 0.3, rect.depth - 0.3), rect.tone === 'hint' ? this.hintMaterial : material);
      plane.rotation.x = -Math.PI / 2;
      plane.position.set(rect.x + rect.width / 2, 0.04, rect.y + rect.depth / 2);
      plane.renderOrder = rect.tone === 'hint' ? 8 : 9;
      this.root.add(plane);
    }
    for (const tile of ghost.tiles) {
      const mesh = new THREE.Mesh(this.tileGeometry, material);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.set(tile.x + 0.5, 0.06, tile.y + 0.5);
      mesh.renderOrder = 10;
      this.root.add(mesh);
    }
    if (ghost.range?.length) this.addRange(ghost.range);
    if (!ghost.front) return;
    const arrow = new THREE.Mesh(this.arrowGeometry, material);
    arrow.rotation.x = -Math.PI / 2;
    arrow.rotation.z = FRONT_ROTATION[ghost.front.direction] ?? 0;
    arrow.position.set(ghost.front.x, 0.3, ghost.front.z);
    arrow.renderOrder = 11;
    this.root.add(arrow);
  }

  private addRange(range: readonly { x: number; y: number }[]): void {
    const mesh = new THREE.InstancedMesh(this.tileGeometry, this.rangeMaterial, range.length);
    const matrix = new THREE.Matrix4();
    range.forEach((tile, index) => mesh.setMatrixAt(index, matrix.makeRotationX(-Math.PI / 2).setPosition(tile.x + 0.5, 0.03, tile.y + 0.5)));
    mesh.renderOrder = 7;
    this.root.add(mesh);
  }

  private disposeChildren(): void {
    for (const child of this.root.children) {
      const mesh = child as THREE.Mesh;
      if ((child as THREE.InstancedMesh).isInstancedMesh) (child as THREE.InstancedMesh).dispose();
      if (mesh.geometry !== this.tileGeometry && mesh.geometry !== this.arrowGeometry) mesh.geometry.dispose();
    }
    this.root.clear();
  }

  dispose(): void {
    this.disposeChildren();
    this.hintMaterial.dispose();
    this.rangeMaterial.dispose();
    this.tileGeometry.dispose();
    this.arrowGeometry.dispose();
    this.validMaterial.dispose();
    this.invalidMaterial.dispose();
  }
}
