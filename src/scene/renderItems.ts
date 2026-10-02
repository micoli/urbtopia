import { GAME_CONFIG, footprintOf, roadExits, roadPiece, type BuildingType, type GameState } from '../core';

export interface RenderItem {
  model: string;
  x: number;
  z: number;
  rotation: number;
}

export const MODEL_BY_BUILDING: Record<BuildingType, string> = {
  workshop: 'industrial/building-h',
  factory: 'industrial/building-b',
  shop: 'commercial/building-a',
  storehouse: 'industrial/building-a',
  home: 'suburban/building-type-k',
  powerPlant: 'industrial/windmill',
  waterTower: 'industrial/water-tower',
};

export function renderItemsOf(state: GameState): RenderItem[] {
  return [...buildingItems(state), ...roadItems(state)];
}

function roadItems(state: GameState): RenderItem[] {
  const tiles = state.roads.map((road) => {
    const { piece, rotation } = roadPiece(roadExits(state, road), road.kind);
    return { model: `roads/road-${piece}`, x: road.x + 0.5, z: road.y + 0.5, rotation };
  });
  const roundabouts = state.roundabouts.map((center) => ({ model: 'roads/road-roundabout', x: center.x + 0.5, z: center.y + 0.5, rotation: 0 }));
  return [...tiles, ...roundabouts];
}

function buildingItems(state: GameState): RenderItem[] {
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
