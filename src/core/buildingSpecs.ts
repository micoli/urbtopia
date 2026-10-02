import type { Coord } from './coord';
import type { Building, BuildingType, Rotation } from './state';

export interface Footprint {
  width: number;
  depth: number;
}

export interface BuildingSpec {
  footprint: Footprint;
  cost: number;
  requiresRoad: boolean;
  initialSlots: number;
}

export const BUILDING_SPECS: Record<BuildingType, BuildingSpec> = {
  workshop: { footprint: { width: 2, depth: 2 }, cost: 100, requiresRoad: true, initialSlots: 2 },
  factory: { footprint: { width: 2, depth: 2 }, cost: 250, requiresRoad: true, initialSlots: 2 },
  shop: { footprint: { width: 1, depth: 1 }, cost: 300, requiresRoad: true, initialSlots: 0 },
  storehouse: { footprint: { width: 2, depth: 2 }, cost: 400, requiresRoad: true, initialSlots: 0 },
  home: { footprint: { width: 1, depth: 1 }, cost: 150, requiresRoad: true, initialSlots: 0 },
  powerPlant: { footprint: { width: 1, depth: 1 }, cost: 250, requiresRoad: false, initialSlots: 0 },
  waterTower: { footprint: { width: 1, depth: 1 }, cost: 200, requiresRoad: false, initialSlots: 0 },
};

export function footprintOf(type: BuildingType, rotation: number): Footprint {
  const { width, depth } = BUILDING_SPECS[type].footprint;
  return rotation % 2 === 0 ? { width, depth } : { width: depth, depth: width };
}

export function footprintTiles(building: { type: BuildingType; x: number; y: number; rotation: Rotation | number }): Coord[] {
  const { width, depth } = footprintOf(building.type, building.rotation);
  const tiles: Coord[] = [];
  for (let dy = 0; dy < depth; dy++) {
    for (let dx = 0; dx < width; dx++) tiles.push({ x: building.x + dx, y: building.y + dy });
  }
  return tiles;
}

export function createBuilding(id: number, type: BuildingType, x: number, y: number, rotation: Rotation): Building {
  return { id, type, x, y, rotation, slotCount: BUILDING_SPECS[type].initialSlots, queue: [] };
}

export function placementCost(type: BuildingType): number {
  return BUILDING_SPECS[type].cost;
}

export type { Building };
