import type { GameState } from '../engine/state';
import type { Coord } from '../map/coord';
import { pedestrianWayNode } from '../map/pedestrianGraph';
import { isPedestrianBridge } from '../water/bridgeGeometry';
import { footbridgeParts } from '../water/footbridgeGeometry';
import type { CongestionStats } from './congestion';

export interface CrossingFlow {
  tile: Coord;
  pedestrians: number;
}

export interface FootbridgeFlow {
  tile: Coord;
  pedestrians: number;
}

export function crossingFlows(congestion: CongestionStats): CrossingFlow[] {
  return [...congestion.crossings.values()]
    .map(({ tile, pedestrians }) => ({ tile, pedestrians }))
    .sort((a, b) => b.pedestrians - a.pedestrians || a.tile.y - b.tile.y || a.tile.x - b.tile.x);
}

// Every walker crossing a Footbridge goes over all its deck tiles, so the first one reads its whole flow; the flow is placed at the middle of the deck.
export function footbridgeFlows(state: GameState, congestion: CongestionStats): FootbridgeFlow[] {
  return (state.bridges ?? [])
    .filter(isPedestrianBridge)
    .map((bridge) => {
      const { deck } = footbridgeParts(bridge);
      return { tile: deck[Math.floor((deck.length - 1) / 2)]!, pedestrians: congestion.sidewalkLoads.get(pedestrianWayNode(deck[0]!)) ?? 0 };
    })
    .sort((a, b) => b.pedestrians - a.pedestrians || a.tile.y - b.tile.y || a.tile.x - b.tile.x);
}

// The flow of the Footbridge whose corridors, stairs or deck cover the tile, if any.
export function footbridgeFlowAt(state: GameState, congestion: CongestionStats, tile: Coord): number | null {
  for (const bridge of (state.bridges ?? []).filter(isPedestrianBridge)) {
    const { corridors, stairs, deck } = footbridgeParts(bridge);
    if (![...corridors, ...stairs, ...deck].some((part) => part.x === tile.x && part.y === tile.y)) continue;
    return congestion.sidewalkLoads.get(pedestrianWayNode(deck[0]!)) ?? 0;
  }
  return null;
}
