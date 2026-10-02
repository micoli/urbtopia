import type { Coord } from './coord';
import type { Building, BuildingType } from './state';

export interface Footprint {
  width: number;
  depth: number;
}

export const BUILDING_FOOTPRINTS: Record<BuildingType, Footprint> = {
  workshop: { width: 2, depth: 2 },
  factory: { width: 2, depth: 2 },
};

export function footprintOf(type: BuildingType, rotation: number): Footprint {
  const { width, depth } = BUILDING_FOOTPRINTS[type];
  return rotation % 2 === 0 ? { width, depth } : { width: depth, depth: width };
}

export function footprintTiles(building: Pick<Building, 'type' | 'x' | 'y' | 'rotation'>): Coord[] {
  const { width, depth } = footprintOf(building.type, building.rotation);
  const tiles: Coord[] = [];
  for (let dy = 0; dy < depth; dy++) {
    for (let dx = 0; dx < width; dx++) tiles.push({ x: building.x + dx, y: building.y + dy });
  }
  return tiles;
}
