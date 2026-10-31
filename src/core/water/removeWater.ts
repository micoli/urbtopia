import { tileKey } from '../map/geometry';
import type { Coord } from '../map/coord';
import type { CommandOutcome } from '../engine/commands';
import type { Boat, GameState } from '../engine/state';
import { boatsCutOff, boatsOf, hostOf } from './boats';
import { bridgeKeys } from './bridges';
import { connectedWaterKeys } from './marina';
import { pirateShipsOverLimit, standsCutOff } from './pirateCove';
import { sceneryWaterKeys, waterTilesOf } from './waterTiles';

function dependentWaterKeys(state: GameState): ReadonlySet<string> {
  return new Set([...bridgeKeys(state), ...sceneryWaterKeys(state)]);
}

// A Boat whose Water tile goes drifts to the nearest free tile of the water of its Marina or Pirate cove, and stays attached to it.
function withBoatsMovedOff(state: GameState, tile: Coord): GameState | null {
  const stranded = boatsOf(state).filter((boat) => tileKey(boat) === tileKey(tile));
  let current = state;
  for (const boat of stranded) {
    const host = hostOf(current, boat.family, boat.marinaId);
    if (!host) return null;
    const taken = new Set([...boatsOf(current).map(tileKey), ...bridgeKeys(current)]);
    const free = [...connectedWaterKeys(current, host)].filter((key) => key !== tileKey(tile) && !taken.has(key)).map((key) => key.split(',').map(Number) as [number, number]);
    const nearest = free.sort(([ax, ay], [bx, by]) => (ax - tile.x) ** 2 + (ay - tile.y) ** 2 - ((bx - tile.x) ** 2 + (by - tile.y) ** 2) || ax - bx || ay - by)[0];
    if (!nearest) return null;
    const moved: Boat = { ...boat, x: nearest[0], y: nearest[1] };
    current = { ...current, boats: boatsOf(current).map((candidate) => (candidate === boat ? moved : candidate)) };
  }
  return current;
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
    const cleared = withBoatsMovedOff(current, tile);
    if (!cleared) continue;
    const next: GameState = { ...cleared, waterTiles: waterTilesOf(cleared).filter((candidate) => tileKey(candidate) !== tileKey(tile)) };
    if (boatsCutOff(next) || pirateShipsOverLimit(next) || standsCutOff(next)) continue;
    current = next;
    removed += 1;
  }
  if (removed === 0) return { key: 'error.waterInUse' };
  return { state: current, events: [] };
}
