import traffic from '../../../assets/defs/balance/traffic.json' with { type: 'json' };
import type { Coord } from '../map/coord';
import type { GameState } from '../engine/state';

export const ROAD_TIER_COSTS: readonly number[] = traffic.roadTierCosts;

export const MAX_ROAD_TIER = ROAD_TIER_COSTS.length;

export const ROAD_TIER_SPEEDS: readonly number[] = traffic.roadSpeeds;

// Tiles a car covers per minute on a road of this Tier when nothing slows it.
export const roadSpeed = (tier: number): number => ROAD_TIER_SPEEDS[Math.min(Math.max(tier, 1), MAX_ROAD_TIER) - 1]!;

export const UNEMPLOYMENT: { tolerance: number; maxPenalty: number } = traffic.unemployment;

export const CONGESTION = {
  laneCapacities: [100, 250, 500],
  maxRatio: 2,
  penaltyCap: 25,
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
