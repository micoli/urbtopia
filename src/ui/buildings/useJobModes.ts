import { congestionStats, type Building, type JobModes } from '../../core';
import { useGame } from '../common/hooks';

export function useJobModes(building: Building): JobModes | undefined {
  return useGame((store) => congestionStats(store.state).jobModes.get(building.id));
}
