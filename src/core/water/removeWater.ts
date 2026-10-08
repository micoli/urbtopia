import { tileKey } from '../map/geometry';
import type { Coord } from '../map/coord';
import type { CommandOutcome } from '../engine/commands';
import type { GameState } from '../engine/state';
import { boatsCutOff, boatsOf } from './boats';
import { waterTilesOf } from './waterTiles';

function dependentWaterKeys(state: GameState): ReadonlySet<string> {
  return new Set(boatsOf(state).map(tileKey));
}

export function removeWater(state: GameState, tiles: readonly Coord[]): CommandOutcome {
  const targets = new Set(tiles.map(tileKey));
  const present = waterTilesOf(state).filter((tile) => targets.has(tileKey(tile)));
  if (present.length === 0) return { key: 'error.noWaterHere' };
  const blocked = dependentWaterKeys(state);
  let current = state;
  let removed = 0;
  for (const tile of present) {
    if (blocked.has(tileKey(tile))) continue;
    const next: GameState = { ...current, waterTiles: waterTilesOf(current).filter((candidate) => tileKey(candidate) !== tileKey(tile)) };
    if (boatsCutOff(next)) continue;
    current = next;
    removed += 1;
  }
  if (removed === 0) return { key: 'error.waterInUse' };
  return { state: current, events: [] };
}
