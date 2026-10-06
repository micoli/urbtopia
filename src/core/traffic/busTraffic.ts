import type { Coord } from '../map/coord';
import { tileKey } from '../map/geometry';
import { CONGESTION } from './roadTier';

export const BUS_TRAFFIC = {
  load: 20,
  slowedBelow: 0.9,
};

export interface BusRoute {
  id: number;
  route: readonly Coord[];
}

export interface BusSpeed {
  factor: number;
  slowed: boolean;
}

export function busRouteTiles(route: readonly Coord[]): string[] {
  return [...new Set(route.map(tileKey))];
}

export function busSpeedFactor(route: readonly Coord[], ratioOf: (key: string) => number): number {
  if (route.length === 0) return 1;
  const time = route.reduce((sum, tile) => sum + 1 + Math.max(0, Math.min(ratioOf(tileKey(tile)), CONGESTION.maxRatio) - 1), 0);
  return route.length / time;
}
