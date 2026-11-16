import type { CommandError, CommandOutcome } from '../engine/commands';
import type { Building, GameState, InteriorData } from '../engine/state';

const EMPTY_INTERIOR: InteriorData = { fixtures: [], nextFixtureId: 1 };

// The new interior of a building, and the Urbs it changes the city by: a cost is negative, a refund positive.
export interface InteriorChange {
  interior: InteriorData;
  urbs?: number;
}

// Edits the interior of one building and the Urbs of the city in one step: finds the building through its gate, lets `change` validate and compute the new interior,
// refuses a change the city cannot pay for (checked last), and replaces that building only.
export function editInterior(
  state: GameState,
  buildingId: number,
  host: (building: Building) => boolean,
  change: (building: Building, interior: InteriorData) => InteriorChange | CommandError,
): CommandOutcome {
  const building = state.buildings.find(candidate => candidate.id === buildingId);
  if (!building || !host(building)) return { key: 'error.unknownBuilding' };
  const changed = change(building, building.interior ?? EMPTY_INTERIOR);
  if ('key' in changed) return changed;
  const urbs = state.urbs + (changed.urbs ?? 0);
  if (urbs < 0) return { key: 'error.notEnoughUrbs' };
  return {
    state: { ...state, urbs, buildings: state.buildings.map(candidate => (candidate === building ? { ...building, interior: changed.interior } : candidate)) },
    events: [],
  };
}
