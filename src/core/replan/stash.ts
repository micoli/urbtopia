import { placementIssue } from '../map/placement';
import type { ErrorKey } from '../engine/commands';
import type { Building, GameState, Rotation } from '../engine/state';

export type StashOutcome = { state: GameState } | { key: ErrorKey };

export function stashedBuildings(state: GameState): readonly Building[] {
  return state.replan?.stash.buildings ?? [];
}

export function liftBuilding(state: GameState, id: number): StashOutcome {
  const building = state.buildings.find((candidate) => candidate.id === id);
  if (!building) return { key: 'error.unknownBuilding' };
  return {
    state: {
      ...state,
      buildings: state.buildings.filter((candidate) => candidate !== building),
      replan: { ...state.replan, stash: { ...state.replan?.stash, buildings: [...stashedBuildings(state), building] } },
    },
  };
}

export function placeStashedBuilding(state: GameState, id: number, x: number, y: number, rotation: Rotation): StashOutcome {
  const building = stashedBuildings(state).find((candidate) => candidate.id === id);
  if (!state.replan || !building) return { key: 'error.unknownBuilding' };
  const issue = placementIssue(state, building.type, x, y, rotation, { isMove: true, replan: true, tier: building.tier });
  if (issue) return { key: issue };
  return {
    state: {
      ...state,
      buildings: [...state.buildings, { ...building, x, y, rotation }],
      replan: { ...state.replan, stash: { ...state.replan.stash, buildings: state.replan.stash.buildings.filter((candidate) => candidate !== building) } },
    },
  };
}
