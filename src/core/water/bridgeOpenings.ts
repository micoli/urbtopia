import { DIRECTIONS, neighbour, tileKey } from '../map/geometry';
import type { Coord } from '../map/coord';
import type { Bridge, GameState } from '../engine/state';
import { bridgeTiles, bridgesOf } from './bridges';
import { waterKeys } from './waterTiles';

export const BRIDGE_OPENING = {
  openingsPerBoatHour: 2,
  minutesPerOpening: 3,
  maxClosed: 0.6,
};

function reachableWater(water: ReadonlySet<string>, start: readonly Coord[]): Set<string> {
  const reached = new Set(start.map(tileKey).filter((key) => water.has(key)));
  const queue = [...reached];
  while (queue.length > 0) {
    const [x, y] = queue.pop()!.split(',').map(Number) as [number, number];
    for (const direction of DIRECTIONS) {
      const key = tileKey(neighbour({ x, y }, direction));
      if (!water.has(key) || reached.has(key)) continue;
      reached.add(key);
      queue.push(key);
    }
  }
  return reached;
}

export function boatsUsingBridge(state: GameState, bridge: Bridge): number {
  const boats = state.boats ?? [];
  if (boats.length === 0) return 0;
  const reachable = reachableWater(waterKeys(state), bridgeTiles(bridge));
  return boats.filter((boat) => reachable.has(tileKey(boat))).length;
}

export function closedFraction(state: GameState, bridge: Bridge): number {
  const { openingsPerBoatHour, minutesPerOpening, maxClosed } = BRIDGE_OPENING;
  return Math.min(maxClosed, (boatsUsingBridge(state, bridge) * openingsPerBoatHour * minutesPerOpening) / 60);
}

export function closedFractionsByTile(state: GameState): Map<string, number> {
  const fractions = new Map<string, number>();
  for (const bridge of bridgesOf(state)) {
    const fraction = closedFraction(state, bridge);
    if (fraction === 0) continue;
    for (const tile of bridgeTiles(bridge)) fractions.set(tileKey(tile), fraction);
  }
  return fractions;
}
