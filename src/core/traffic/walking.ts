import type { CongestionStats } from './congestion';

export const WALKING = {
  workThreshold: 10,
};

export interface ModeShares {
  car: number;
  transit: number;
  walking: number;
}

export function modeShares(stats: CongestionStats): ModeShares {
  const total = stats.modes.car + stats.modes.transit + stats.modes.walking;
  if (total <= 0) return { car: 0, transit: 0, walking: 0 };
  return { car: stats.modes.car / total, transit: stats.modes.transit / total, walking: stats.modes.walking / total };
}
