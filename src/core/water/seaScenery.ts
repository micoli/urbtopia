import { createBuilding, footprintTiles } from '../buildings/buildingSpecs';
import type { BuildingType, GameState, Rotation } from '../engine/state';
import { tileKey } from '../map/geometry';
import { boatsCutOff, boatsOf } from './boats';
import { bridgeKeys } from './bridges';
import { pirateShipsOverLimit, standsCutOff } from './pirateCove';
import { sceneryWaterKeys, waterKeys } from './waterTiles';

export type SeaSceneryIssue = 'error.needsWaterTiles' | 'error.tilesOccupied' | 'error.waterInUse';

export function seaSceneryIssue(state: GameState, type: BuildingType, x: number, y: number, rotation: Rotation): SeaSceneryIssue | null {
  const keys = footprintTiles({ type, x, y, rotation }).map(tileKey);
  const water = waterKeys(state);
  if (!keys.every((key) => water.has(key))) return 'error.needsWaterTiles';
  const taken = new Set([...boatsOf(state).map(tileKey), ...bridgeKeys(state), ...sceneryWaterKeys(state)]);
  if (keys.some((key) => taken.has(key))) return 'error.tilesOccupied';
  const next = { ...state, buildings: [...state.buildings, createBuilding(0, type, x, y, rotation)] };
  return boatsCutOff(next) || pirateShipsOverLimit(next) || standsCutOff(next) ? 'error.waterInUse' : null;
}
