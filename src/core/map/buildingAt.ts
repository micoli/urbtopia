import { footprintTiles } from '../buildings/buildingSpecs';
import type { GameState } from '../engine/state';
import type { Coord } from './coord';

export function buildingAt(state: GameState, tile: Coord): number | undefined {
  return state.buildings.find(building => footprintTiles(building).some(p => p.x === tile.x && p.y === tile.y))?.id;
}
