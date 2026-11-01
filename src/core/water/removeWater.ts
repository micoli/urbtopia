import { tileKey } from '../map/geometry';
import type { Coord } from '../map/coord';
import type { CommandOutcome } from '../engine/commands';
import type { GameState } from '../engine/state';
import { boatsCutOff } from './boats';
import { withBoatsMovedOff } from './boatRelocation';
import { bridgeKeys } from './bridges';
import { pirateShipsOverLimit, standsCutOff } from './pirateCove';
import { sceneryWaterKeys, waterTilesOf } from './waterTiles';

function dependentWaterKeys(state: GameState): ReadonlySet<string> {
  return new Set([...bridgeKeys(state), ...sceneryWaterKeys(state)]);
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
    const cleared = withBoatsMovedOff(current, new Set([tileKey(tile)]));
    if (!cleared) continue;
    const next: GameState = { ...cleared, waterTiles: waterTilesOf(cleared).filter((candidate) => tileKey(candidate) !== tileKey(tile)) };
    if (boatsCutOff(next) || pirateShipsOverLimit(next) || standsCutOff(next)) continue;
    current = next;
    removed += 1;
  }
  if (removed === 0) return { key: 'error.waterInUse' };
  return { state: current, events: [] };
}
