import { citizenCount } from '../environment/ecology';
import { GAME_CONFIG } from '../engine/config';
import { isInsideOwnedParcels, isRoadLike } from '../map/occupancy';
import { neighbour, tileKey } from '../map/geometry';
import type { Coord } from '../map/coord';
import type { CommandOutcome } from '../engine/commands';
import type { Bridge, GameState } from '../engine/state';
import { waterKeys } from './waterTiles';

export const BRIDGE_LENGTHS: readonly number[] = [1, 2, 3, 5];

export const BRIDGES = {
  unlockCitizens: 120,
  costs: { 1: 150, 2: 300, 3: 450, 5: 800 } as Readonly<Record<number, number>>,
};

export function bridgesOf(state: GameState): readonly Bridge[] {
  return state.bridges ?? [];
}

export function bridgeTiles(bridge: Bridge): Coord[] {
  return Array.from({ length: bridge.length }, (_, index) => (bridge.axis === 'x' ? { x: bridge.x + index, y: bridge.y } : { x: bridge.x, y: bridge.y + index }));
}

export function bridgeKeys(state: GameState): Set<string> {
  return new Set(bridgesOf(state).flatMap(bridgeTiles).map(tileKey));
}

export function bridgeEnds(bridge: Bridge): [Coord, Coord] {
  const along = bridge.axis === 'x' ? 'E' : 'S';
  const back = bridge.axis === 'x' ? 'W' : 'N';
  const tiles = bridgeTiles(bridge);
  return [neighbour(tiles[0]!, back), neighbour(tiles[tiles.length - 1]!, along)];
}

export function bridgeCost(length: number): number | undefined {
  return BRIDGES.costs[length];
}

export function placeBridge(state: GameState, bridge: Bridge): CommandOutcome {
  if (citizenCount(state) < BRIDGES.unlockCitizens) return { key: 'error.itemLocked' };
  const price = bridgeCost(bridge.length);
  if (price === undefined || !Number.isInteger(bridge.x) || !Number.isInteger(bridge.y) || (bridge.axis !== 'x' && bridge.axis !== 'y')) return { key: 'error.unknownCommand' };
  const tiles = bridgeTiles(bridge);
  if (!tiles.every((tile) => isInsideOwnedParcels(state, tile))) return { key: 'error.outsideOwnedParcels' };
  const water = waterKeys(state);
  if (!tiles.every((tile) => water.has(tileKey(tile)))) return { key: 'error.bridgeNeedsWater' };
  const taken = new Set([...bridgeKeys(state), ...(state.boats ?? []).map(tileKey)]);
  if (tiles.some((tile) => taken.has(tileKey(tile)))) return { key: 'error.tilesOccupied' };
  if (!bridgeEnds(bridge).every((end) => isRoadLike(state, end))) return { key: 'error.bridgeNeedsRoad' };
  if (state.urbs < price) return { key: 'error.notEnoughUrbs' };
  return {
    state: {
      ...state,
      urbs: state.urbs - price,
      bridges: [...bridgesOf(state), bridge],
      roads: [...state.roads, ...tiles.map((tile) => ({ ...tile, kind: 'road' as const }))],
    },
    events: [],
  };
}

export function bridgeAt(state: GameState, tile: Coord): Bridge | undefined {
  return bridgesOf(state).find((bridge) => bridgeTiles(bridge).some((candidate) => tileKey(candidate) === tileKey(tile)));
}

export function withoutBridge(state: GameState, bridge: Bridge): GameState {
  const covered = new Set(bridgeTiles(bridge).map(tileKey));
  return {
    ...state,
    bridges: bridgesOf(state).filter((candidate) => candidate !== bridge),
    roads: state.roads.filter((road) => !covered.has(tileKey(road))),
  };
}

export function refundOf(bridge: Bridge): number {
  return Math.floor((bridgeCost(bridge.length) ?? 0) * GAME_CONFIG.sellRefundRatio);
}
