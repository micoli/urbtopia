import type { Building, GameState } from '../engine/state';
import type { CongestionStats } from './congestion';
import { jobsOf, workplaceTypes } from './jobs';

export interface UnfilledWorkplace {
  building: Building;
  offered: number;
  filled: number;
}

// The workplaces with the most Jobs nobody fills, so the player can see which buildings have no employees.
export function unfilledWorkplaces(state: GameState, congestion: CongestionStats, limit = 8): UnfilledWorkplace[] {
  return state.buildings
    .filter((building) => workplaceTypes.includes(building.type) && congestion.filledJobs.has(building.id))
    .map((building) => ({ building, offered: jobsOf(building), filled: congestion.filledJobs.get(building.id) ?? 0 }))
    .filter(({ offered, filled }) => offered - filled > 1e-9)
    .sort((a, b) => (b.offered - b.filled) - (a.offered - a.filled) || a.building.id - b.building.id)
    .slice(0, limit);
}
