import { BUS_TRAFFIC } from '../../../../core';
import type { LineSummary } from './LineMetrics.tsx';

export function speedPercent(line: LineSummary): number {
  return Math.round(line.speedFactor * 100);
}

export function isSlowedByTraffic(line: LineSummary): boolean {
  return line.mode === 'bus' && line.active && line.speedFactor < BUS_TRAFFIC.slowedBelow;
}
