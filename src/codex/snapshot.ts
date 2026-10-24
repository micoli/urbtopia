import { BUILDING_SPECS, CROPS, createBuilding, isCrop, isFacilityType, newGame, type Building, type BuildingType, type GameState, type ColorVariant, type Rotation } from '../core';
import { definitionOf } from '../scene/modelDefinitions';
import { modelOfBuilding } from '../scene/renderItems';
import { isHomeCodexId, solarBaseOf, type CodexId } from './catalog';

const FACING_CAMERA = 2;

function facingCameraRotation(building: Building): Rotation {
  return definitionOf(modelOfBuilding(building))?.source === 'managed' ? FACING_CAMERA : 0;
}

export function codexSnapshot(id: CodexId, tier: number, colorVariant: ColorVariant = 'default'): GameState {
  const state: GameState = { ...newGame({ seed: 'codex', now: 0 }), buildings: [], roads: [], roundabouts: [], brtRoads: [], rails: [], busLines: [], transitLines: [], transitFleet: [] };
  const solarBase = solarBaseOf(id);
  if (solarBase || id in BUILDING_SPECS) {
    const type = solarBase ?? id as BuildingType;
    const facility = !solarBase && isFacilityType(id);
    const building: Building = {
      ...createBuilding(1, type, 0, 0, facility ? 2 : 0),
      tier,
      ...(solarBase ? { solar: true } : {}),
      ...(isHomeCodexId(id) ? { colorVariant } : {}),
    };
    state.buildings = [facility ? building : { ...building, rotation: facingCameraRotation(building) }];
    return state;
  }
  if (isCrop(id)) {
    const progress = tier > 4 ? 1 : (tier - 0.5) / 4;
    state.fields = [{ x: 0, y: 0, crop: { species: id, plantedAt: state.lastSeen - CROPS[id].growthMs * progress } }];
    return state;
  }
  if (id === 'roundabout') {
    state.roundabouts = [{ x: 0, y: 0 }];
    return state;
  }
  if (id === 'water' || id === 'bridge') {
    const lake = Array.from({ length: 9 }, (_, index) => ({ x: 1 + (index % 3), y: Math.floor(index / 3) - 1 }));
    state.waterTiles = lake;
    if (id === 'water') return state;
    state.bridges = [{ x: 1, y: 0, length: 3, axis: 'x' }];
    state.roads = [0, 1, 2, 3, 4].map(x => ({ x, y: 0, kind: 'road' as const }));
    return state;
  }
  const tiles = Array.from({ length: 3 }, (_, x) => ({ x, y: 0 }));
  if (id === 'road' || id === 'crossing') {
    state.roads = tiles.map(tile => ({ ...tile, kind: id === 'crossing' && tile.x === 1 ? 'crossing' : 'road' }));
    return state;
  }
  if (id === 'pedestrianWay') {
    state.pedestrianWays = tiles;
    return state;
  }
  const network = tiles.map(tile => ({ ...tile, exits: ['E', 'W'] as const })).map(tile => ({ ...tile, exits: [...tile.exits] }));
  if (id === 'brt') state.brtRoads = network;
  if (id === 'rail') state.rails = network;
  return state;
}
