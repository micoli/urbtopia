import { placementIssue } from '../map/placement';
import type { ErrorKey } from '../engine/commands';
import type { Building, GameState, Rotation, Stash } from '../engine/state';

export type StashOutcome = { state: GameState } | { key: ErrorKey };

const EMPTY_STASH: Stash = { buildings: [] };

export const stashOf = (state: GameState): Stash => state.replan?.stash ?? EMPTY_STASH;

export const withStash = (state: GameState, patch: Partial<Stash>): GameState => ({
  ...state,
  replan: { ...state.replan, stash: { ...stashOf(state), ...patch } },
});

export function stashedBuildings(state: GameState): readonly Building[] {
  return stashOf(state).buildings;
}

export function liftBuilding(state: GameState, id: number): StashOutcome {
  const building = state.buildings.find((candidate) => candidate.id === id);
  if (!building) return { key: 'error.unknownBuilding' };
  return {
    state: withStash({ ...state, buildings: state.buildings.filter((candidate) => candidate !== building) }, { buildings: [...stashedBuildings(state), building] }),
  };
}

export function placeStashedBuilding(state: GameState, id: number, x: number, y: number, rotation: Rotation): StashOutcome {
  const building = stashedBuildings(state).find((candidate) => candidate.id === id);
  if (!state.replan || !building) return { key: 'error.unknownBuilding' };
  const issue = placementIssue(state, building.type, x, y, rotation, { isMove: true, replan: true, tier: building.tier });
  if (issue) return { key: issue };
  return {
    state: withStash({ ...state, buildings: [...state.buildings, { ...building, x, y, rotation }] }, { buildings: stashedBuildings(state).filter((candidate) => candidate !== building) }),
  };
}
