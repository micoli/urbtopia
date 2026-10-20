import { congestionStats, type Building } from '../../core';
import { useGame } from '../common/hooks';

export function useFilledJobs(building: Building): number {
  return useGame((store) => congestionStats(store.state).filledJobs.get(building.id) ?? 0);
}
