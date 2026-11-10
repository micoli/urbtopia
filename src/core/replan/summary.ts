import { BUILDING_SPECS } from '../buildings/buildingSpecs';
import { frontHasAccess } from '../map/placement';
import type { BuildingType, GameState } from '../engine/state';

export interface ReplanSummary {
  // Buildings whose front touches no Road, BRT corridor or Pedestrian way they could use.
  withoutAccess: { id: number; type: BuildingType }[];
  // Bus and Transit lines of the City before the Replan, which the player draws again.
  droppedLines: number;
}

export function replanSummary(state: GameState): ReplanSummary {
  const start = state.replan?.start;
  return {
    withoutAccess: state.buildings
      .filter((building) => BUILDING_SPECS[building.type].requiresRoad && !frontHasAccess(state, building.type, building.x, building.y, building.rotation, building.tier))
      .map(({ id, type }) => ({ id, type })),
    droppedLines: (start?.busLines?.length ?? 0) + (start?.transitLines?.length ?? 0),
  };
}

export const isReplanSummaryEmpty = (summary: ReplanSummary): boolean => summary.withoutAccess.length === 0 && summary.droppedLines === 0;
