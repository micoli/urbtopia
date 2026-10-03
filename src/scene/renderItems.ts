import { GAME_CONFIG, footprintOf, roadExits, roadPiece, type BuildingType, type GameState } from '../core';
import { VEHICLE_MODELS } from './vehicleModels';

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

const HOME_MODELS = [
  'suburban/building-type-k',
  'suburban/building-type-h',
  'suburban/building-type-a',
  'suburban/building-type-b',
  'suburban/building-type-f',
  'suburban/building-type-n',
];

const ROAD_MODELS = ['square', 'end', 'straight', 'bend', 'intersection', 'crossroad', 'crossing', 'roundabout'].map((piece) => `roads/road-${piece}`);

export const MODEL_KEYS: readonly string[] = [...new Set([...Object.values(MODEL_BY_BUILDING), ...HOME_MODELS, ...ROAD_MODELS, ...VEHICLE_MODELS])];

function modelOf(type: BuildingType, tier: number): string {
  if (type === 'home') return HOME_MODELS[tier - 1] ?? MODEL_BY_BUILDING.home;
  return MODEL_BY_BUILDING[type];
}

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
    const { width, depth } = footprintOf(building.type, building.rotation, building.tier);
    return {
      model: modelOf(building.type, building.tier),
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
