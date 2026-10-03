import * as THREE from 'three';
import { footprintOf, type Building } from '../core';

export interface BuildingBox {
  id: number;
  box: THREE.Box3;
}

export function buildingBoxes(buildings: readonly Building[], heightOf: (building: Building) => number): BuildingBox[] {
  return buildings.map((building) => {
    const { width, depth } = footprintOf(building.type, building.rotation, building.tier);
    const box = new THREE.Box3(
      new THREE.Vector3(building.x, 0, building.y),
      new THREE.Vector3(building.x + width, heightOf(building), building.y + depth),
    );
    return { id: building.id, box };
  });
}

export function pickBuilding(ray: THREE.Ray, boxes: readonly BuildingBox[]): number | null {
  const hit = new THREE.Vector3();
  let nearest: { id: number; distance: number } | null = null;
  for (const { id, box } of boxes) {
    if (!ray.intersectBox(box, hit)) continue;
    const distance = ray.origin.distanceToSquared(hit);
    if (!nearest || distance < nearest.distance) nearest = { id, distance };
  }
  return nearest?.id ?? null;
}
