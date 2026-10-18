import * as THREE from 'three';
import { coveredHomeIds, footprintOf, isHomeType, wasteReport, type Building, type GameState, type FacilityType } from '../core';

const COLORS = { covered: 0x35d07f, uncovered: 0xe5484d, facility: 0x4da3ff } as const;

export class ServiceCoverageLayer {
  readonly root = new THREE.Group();
  private tileGeometry = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
  private coveredMaterial = this.overlayMaterial(COLORS.covered);
  private uncoveredMaterial = this.overlayMaterial(COLORS.uncovered);
  private markers = new THREE.LineSegments(
    new THREE.BufferGeometry(),
    new THREE.LineBasicMaterial({ color: COLORS.facility, depthTest: false, depthWrite: false, toneMapped: false }),
  );
  private buildings: GameState['buildings'] | null = null;
  private wasteStamp: unknown = null;
  private type: FacilityType | null = null;

  constructor() {
    this.root.name = 'service-coverage';
    this.root.renderOrder = 6;
    this.root.visible = false;
    this.markers.name = 'service-facilities';
    this.markers.renderOrder = 7;
    this.root.add(this.markers);
  }

  sync(state: GameState, type: FacilityType | null): void {
    if (!type) {
      this.type = null;
      this.root.visible = false;
      return;
    }
    const wasteStamp = wasteReport(state);
    if (this.buildings === state.buildings && this.type === type && this.wasteStamp === wasteStamp) return;
    this.buildings = state.buildings;
    this.wasteStamp = wasteStamp;
    this.type = type;
    this.root.visible = true;
    this.clearOverlays();
    const coveredIds = coveredHomeIds(state, type);
    const covered: Building[] = [], uncovered: Building[] = [];
    for (const home of state.buildings) {
      if (!isHomeType(home.type)) continue;
      (coveredIds.has(home.id) ? covered : uncovered).push(home);
    }
    this.addOverlay(covered, this.coveredMaterial, 'covered-homes');
    this.addOverlay(uncovered, this.uncoveredMaterial, 'uncovered-homes');
    const positions: number[] = [];
    for (const building of state.buildings) {
      if (building.type !== type) continue;
      const { width, depth } = footprintOf(building.type, building.rotation, building.tier);
      const left = building.x - 0.15, right = building.x + width + 0.15;
      const top = building.y - 0.15, bottom = building.y + depth + 0.15;
      positions.push(left, 0.08, top, right, 0.08, top, right, 0.08, top, right, 0.08, bottom,
        right, 0.08, bottom, left, 0.08, bottom, left, 0.08, bottom, left, 0.08, top);
    }
    this.markers.geometry.dispose();
    this.markers.geometry = new THREE.BufferGeometry();
    this.markers.geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  }

  private overlayMaterial(color: number): THREE.MeshBasicMaterial {
    return new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.55, depthTest: false, depthWrite: false, toneMapped: false });
  }

  private addOverlay(homes: readonly Building[], material: THREE.MeshBasicMaterial, name: string): void {
    if (!homes.length) return;
    const mesh = new THREE.InstancedMesh(this.tileGeometry, material, homes.length);
    mesh.name = name;
    mesh.renderOrder = 6;
    const matrix = new THREE.Matrix4();
    homes.forEach((home, index) => {
      const { width, depth } = footprintOf(home.type, home.rotation, home.tier);
      matrix.makeScale(width - 0.08, 1, depth - 0.08).setPosition(home.x + width / 2, 0.09, home.y + depth / 2);
      mesh.setMatrixAt(index, matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    this.root.add(mesh);
  }

  private clearOverlays(): void {
    for (const child of [...this.root.children]) {
      if (!(child instanceof THREE.InstancedMesh)) continue;
      this.root.remove(child);
      child.dispose();
    }
  }

  dispose(): void {
    this.clearOverlays();
    this.tileGeometry.dispose();
    this.coveredMaterial.dispose();
    this.uncoveredMaterial.dispose();
    this.markers.geometry.dispose();
    this.markers.material.dispose();
    this.root.clear();
  }
}
