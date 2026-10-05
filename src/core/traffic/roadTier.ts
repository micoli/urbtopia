import type { Coord } from '../map/coord';
import type { GameState } from '../engine/state';

export const MAX_ROAD_TIER = 3;

export const ROAD_TIER_COSTS: readonly number[] = [0, 6, 12];

export const CONGESTION = {
  laneCapacities: [60, 140, 240],
  maxRatio: 2,
  penaltyCap: 20,
};

export function roadTierOf(state: GameState, tile: Coord): number {
  return state.roads.find((road) => road.x === tile.x && road.y === tile.y)?.tier ?? 1;
}

export function laneCapacity(tier: number): number {
  return CONGESTION.laneCapacities[Math.min(Math.max(tier, 1), MAX_ROAD_TIER) - 1] ?? 0;
}

export function roadTierUpgradeCost(tier: number): number | null {
  if (tier >= MAX_ROAD_TIER) return null;
  return ROAD_TIER_COSTS[tier] ?? null;
}
