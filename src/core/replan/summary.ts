import { BUILDING_SPECS } from '../buildings/buildingSpecs';
import { frontHasAccess } from '../map/placement';
import type { BuildingType, GameState } from '../engine/state';

export interface ReplanSummary {
  // Buildings whose front touches no Road, BRT corridor or Pedestrian way they could use.
  withoutAccess: { id: number; type: BuildingType }[];
  // Bus and Transit lines that lost a stop to the Stash, or all of them, and which the player has to look at.
  brokenLines: number;
}

function brokenLinesOf(state: GameState): number {
  const start = state.replan?.start;
  const broken = (before: readonly { id: number; stops: number[] }[] | undefined, now: readonly { id: number; stops: number[] }[] | undefined) =>
    (before ?? []).filter((line) => now?.find((candidate) => candidate.id === line.id)?.stops.length !== line.stops.length).length;
  return broken(start?.busLines, state.busLines) + broken(start?.transitLines, state.transitLines);
}

export function replanSummary(state: GameState): ReplanSummary {
  return {
    withoutAccess: state.buildings
      .filter((building) => BUILDING_SPECS[building.type].requiresRoad && !frontHasAccess(state, building.type, building.x, building.y, building.rotation, building.tier))
      .map(({ id, type }) => ({ id, type })),
    brokenLines: brokenLinesOf(state),
  };
}

export const isReplanSummaryEmpty = (summary: ReplanSummary): boolean => summary.withoutAccess.length === 0 && summary.brokenLines === 0;
