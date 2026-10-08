import { citizenCount } from '../environment/ecology';
import { isInsideOwnedParcels, occupiedTiles } from '../map/occupancy';
import { tileKey } from '../map/geometry';
import type { Coord } from '../map/coord';
import type { CommandOutcome, ErrorKey } from '../engine/commands';
import type { GameState } from '../engine/state';

export const WATER = {
  tileCost: 30,
  unlockCitizens: 40,
};

export function waterTilesOf(state: GameState): readonly Coord[] {
  return state.waterTiles ?? [];
}

export function waterKeys(state: GameState): Set<string> {
  return new Set(waterTilesOf(state).map(tileKey));
}

export function isWaterTile(state: GameState, tile: Coord): boolean {
  return waterTilesOf(state).some((candidate) => candidate.x === tile.x && candidate.y === tile.y);
}

export function layWater(state: GameState, tiles: readonly Coord[]): CommandOutcome {
  if (citizenCount(state) < WATER.unlockCitizens) return { key: 'error.itemLocked' };
  const occupied = occupiedTiles(state);
  const laid: Coord[] = [];
  let firstIssue: ErrorKey | null = null;
  for (const tile of tiles) {
    const issue = layIssue(state, tile, occupied, state.urbs - (laid.length + 1) * WATER.tileCost);
    if (issue === 'error.notEnoughUrbs') {
      firstIssue ??= issue;
      break;
    }
    if (issue) {
      firstIssue ??= issue;
      continue;
    }
    occupied.add(tileKey(tile));
    laid.push({ x: tile.x, y: tile.y });
  }
  if (laid.length === 0) return { key: firstIssue ?? 'error.tilesOccupied' };
  return { state: { ...state, urbs: state.urbs - laid.length * WATER.tileCost, waterTiles: [...waterTilesOf(state), ...laid] }, events: [] };
}

function layIssue(state: GameState, tile: Coord, occupied: ReadonlySet<string>, urbsAfter: number): ErrorKey | null {
  if (!isInsideOwnedParcels(state, tile)) return 'error.outsideOwnedParcels';
  if (occupied.has(tileKey(tile))) return 'error.tilesOccupied';
  if (urbsAfter < 0) return 'error.notEnoughUrbs';
  return null;
}
