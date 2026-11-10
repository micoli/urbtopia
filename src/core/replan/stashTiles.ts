import { isInsideOwnedParcels, occupiedTiles, roundaboutTiles } from '../map/occupancy';
import { tileKey } from '../map/geometry';
import type { Coord } from '../map/coord';
import type { GameState } from '../engine/state';
import { stashOf, withStash, type StashOutcome } from './stash';

// Layers of single tiles that a Replan lifts and places one by one; Surface layers need a free tile, Level -1 does not.
export type TileLayer = 'roads' | 'pedestrianWays' | 'walkways' | 'pedestrianAccesses' | 'waterTiles' | 'fields' | 'roundabouts';

const UNDERGROUND: readonly TileLayer[] = ['walkways'];

const tilesOf = (state: GameState, layer: TileLayer): readonly Coord[] => state[layer] ?? [];
const stashedTilesOf = (state: GameState, layer: TileLayer): readonly Coord[] => stashOf(state)[layer] ?? [];

export function liftTiles(state: GameState, layer: TileLayer, targets: readonly Coord[]): StashOutcome {
  const keys = new Set(targets.map(tileKey));
  const lifted = tilesOf(state, layer).filter((tile) => keys.has(tileKey(tile)));
  if (lifted.length === 0) return { key: 'error.unknownCommand' };
  const kept = tilesOf(state, layer).filter((tile) => !keys.has(tileKey(tile)));
  return { state: withStash({ ...state, [layer]: kept }, { [layer]: [...stashedTilesOf(state, layer), ...lifted] }) };
}

const footprintOf = (layer: TileLayer, target: Coord): readonly Coord[] => (layer === 'roundabouts' ? roundaboutTiles(target) : [target]);

function placementKey(state: GameState, layer: TileLayer, target: Coord): 'error.outsideOwnedParcels' | 'error.tilesOccupied' | null {
  const tiles = footprintOf(layer, target);
  if (!tiles.every((tile) => isInsideOwnedParcels(state, tile))) return 'error.outsideOwnedParcels';
  if (UNDERGROUND.includes(layer)) return tilesOf(state, layer).some((tile) => tileKey(tile) === tileKey(target)) ? 'error.tilesOccupied' : null;
  const occupied = occupiedTiles(state);
  return tiles.some((tile) => occupied.has(tileKey(tile))) ? 'error.tilesOccupied' : null;
}

// Each target takes the first tile of the Stash that `pick` accepts (a Road of a given tier, for instance); nothing is placed unless every target fits.
export function placeStashedTiles(state: GameState, layer: TileLayer, targets: readonly Coord[], pick: (tile: Coord) => boolean = () => true): StashOutcome {
  if (!state.replan) return { key: 'error.unknownCommand' };
  let current = state;
  for (const target of targets) {
    const item = stashedTilesOf(current, layer).find(pick);
    if (!item) return { key: 'error.unknownCommand' };
    const issue = placementKey(current, layer, target);
    if (issue) return { key: issue };
    current = withStash({ ...current, [layer]: [...tilesOf(current, layer), { ...item, x: target.x, y: target.y }] }, { [layer]: stashedTilesOf(current, layer).filter((tile) => tile !== item) });
  }
  return { state: current };
}
