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
  silo: 'industrial/building-p',
  vault: 'industrial/building-s',
};

const FACTORY_MODELS = ['industrial/building-b', 'industrial/building-e', 'industrial/building-f', 'industrial/building-l', 'industrial/building-c'];

const STOREHOUSE_MODELS = ['industrial/building-a', 'industrial/building-a', 'industrial/building-a', 'industrial/building-q', 'industrial/building-q', 'industrial/building-q'];

const HOME_MODELS = [
  'suburban/building-type-k',
  'suburban/building-type-h',
  'suburban/building-type-a',
  'suburban/building-type-b',
  'suburban/building-type-f',
  'suburban/building-type-n',
  'suburban/building-type-t',
  'suburban/building-type-m',
];

const ROAD_MODELS = ['square', 'end', 'straight', 'bend', 'intersection', 'crossroad', 'crossing', 'roundabout'].map((piece) => `roads/road-${piece}`);

export const MODEL_KEYS: readonly string[] = [...new Set([...Object.values(MODEL_BY_BUILDING), ...FACTORY_MODELS, ...STOREHOUSE_MODELS, ...HOME_MODELS, ...ROAD_MODELS, ...VEHICLE_MODELS])];

export function modelOf(type: BuildingType, tier: number): string {
  if (type === 'home') return HOME_MODELS[tier - 1] ?? MODEL_BY_BUILDING.home;
  if (type === 'factory') return FACTORY_MODELS[tier - 1] ?? MODEL_BY_BUILDING.factory;
  if (type === 'storehouse') return STOREHOUSE_MODELS[tier - 1] ?? MODEL_BY_BUILDING.storehouse;
  return MODEL_BY_BUILDING[type];
}

let lastBuildingItems: RenderItem[] = [];
let lastRoadItems: { roads: GameState['roads']; roundabouts: GameState['roundabouts']; items: RenderItem[] } | null = null;
let lastItems: { buildings: RenderItem[]; roads: RenderItem[]; items: RenderItem[] } | null = null;

function sameItems(a: RenderItem[], b: RenderItem[]): boolean {
  return a.length === b.length && a.every((item, index) => {
    const other = b[index] as RenderItem;
    return item.model === other.model && item.x === other.x && item.z === other.z && item.rotation === other.rotation;
  });
}

export function renderItemsOf(state: GameState): RenderItem[] {
  const builtBuildings = buildingItems(state);
  const buildings = sameItems(builtBuildings, lastBuildingItems) ? lastBuildingItems : builtBuildings;
  lastBuildingItems = buildings;

  if (lastRoadItems?.roads !== state.roads || lastRoadItems.roundabouts !== state.roundabouts) {
    lastRoadItems = { roads: state.roads, roundabouts: state.roundabouts, items: roadItems(state) };
  }
  const roads = lastRoadItems.items;

  if (lastItems && lastItems.buildings === buildings && lastItems.roads === roads) return lastItems.items;
  const items = [...buildings, ...roads];
  lastItems = { buildings, roads, items };
  return items;
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
