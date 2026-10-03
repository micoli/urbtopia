import { BUILDING_SPECS, createBuilding, newGame, type BuildingType, type GameState, type HomeColorVariant } from '../core';
import type { CodexId } from './catalog';

export function codexSnapshot(id: CodexId, tier: number, colorVariant: HomeColorVariant = 'default'): GameState {
  const state: GameState = { ...newGame({ seed: 'codex', now: 0 }), buildings: [], roads: [], roundabouts: [], brtRoads: [], rails: [], busLines: [], transitLines: [], transitFleet: [] };
  if (id === 'solarHome' || id in BUILDING_SPECS) {
    const building = createBuilding(1, id === 'solarHome' ? 'home' : id as BuildingType, 0, 0, 0);
    state.buildings = [{ ...building, tier, ...(id === 'solarHome' ? { solar: true } : {}), ...(id === 'home' || id === 'solarHome' ? { colorVariant } : {}) }];
    return state;
  }
  if (id === 'roundabout') {
    state.roundabouts = [{ x: 0, y: 0 }];
    return state;
  }
  const tiles = Array.from({ length: 3 }, (_, x) => ({ x, y: 0 }));
  if (id === 'road' || id === 'crossing') {
    state.roads = tiles.map(tile => ({ ...tile, kind: id === 'crossing' && tile.x === 1 ? 'crossing' : 'road' }));
    return state;
  }
  const network = tiles.map(tile => ({ ...tile, exits: ['E', 'W'] as const })).map(tile => ({ ...tile, exits: [...tile.exits] }));
  if (id === 'brt') state.brtRoads = network;
  if (id === 'rail') state.rails = network;
  return state;
}
