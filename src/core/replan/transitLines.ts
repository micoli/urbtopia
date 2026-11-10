import type { GameState } from '../engine/state';

// Lines are tied to where their stops stand, so a Replan drops them; the purchased vehicles stay with the City, assigned to nothing.
export function withoutTransitLines(state: GameState): GameState {
  return {
    ...state,
    busLines: [],
    transitLines: [],
    transitFleet: (state.transitFleet ?? []).map(({ lineId: _lineId, ...vehicle }) => vehicle),
  };
}
