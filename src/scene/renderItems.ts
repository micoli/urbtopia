import { GAME_CONFIG, footprintOf, type BuildingType, type GameState } from '../core';

export interface RenderItem {
  model: string;
  x: number;
  z: number;
  rotation: number;
}

export const MODEL_BY_BUILDING: Record<BuildingType, string> = {
  workshop: 'industrial/building-h',
  factory: 'industrial/building-b',
};

export function renderItemsOf(state: GameState): RenderItem[] {
  return state.buildings.map((building) => {
    const { width, depth } = footprintOf(building.type, building.rotation);
    return {
      model: MODEL_BY_BUILDING[building.type],
      x: building.x + width / 2,
      z: building.y + depth / 2,
      rotation: building.rotation,
    };
  });
}

export function chunkKeyOf(x: number, z: number): string {
  const size = GAME_CONFIG.parcelSizeInTiles;
  return `${Math.floor(x / size)},${Math.floor(z / size)}`;
}
