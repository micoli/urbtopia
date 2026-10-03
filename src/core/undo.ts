import type { Command } from './commands';
import type { Coord } from './coord';
import { shiftRunningTimers } from './production';
import type { Building, GameState, RoadTile } from './state';

export interface DeletionUndo {
  buildings: Building[];
  roads: RoadTile[];
  roundabouts: Coord[];
  urbs: number;
  deletedAt: number;
}

export function captureDeletion(before: GameState, after: GameState, command: Command): DeletionUndo | null {
  if (!['SellBuilding', 'DemolishRoad', 'DemolishRoadPath'].includes(command.type)) return null;
  return {
    buildings: before.buildings.filter((building) => !after.buildings.some((candidate) => candidate.id === building.id)),
    roads: before.roads.filter((road) => !after.roads.includes(road)),
    roundabouts: before.roundabouts.filter((center) => !after.roundabouts.includes(center)),
    urbs: before.urbs - after.urbs,
    deletedAt: before.lastSeen,
  };
}

export function restoreDeletion(state: GameState, undo: DeletionUndo): GameState {
  const restored = shiftRunningTimers({ ...state, buildings: undo.buildings }, state.lastSeen - undo.deletedAt);
  return {
    ...state,
    buildings: [...state.buildings, ...restored.buildings],
    roads: [...state.roads, ...undo.roads],
    roundabouts: [...state.roundabouts, ...undo.roundabouts],
    urbs: state.urbs + undo.urbs,
  };
}
