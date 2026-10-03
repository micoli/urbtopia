import { createBuilding } from './buildingSpecs';
import type { Coord } from './coord';
import { FACILITY_TYPES } from './facilities';
import type { GameState } from './state';

export function withAllServices(state: GameState, near: Coord): GameState {
  const facilities = FACILITY_TYPES.map((type, index) => createBuilding(state.nextId + index, type, near.x, near.y + 4, 0));
  return { ...state, nextId: state.nextId + facilities.length, buildings: [...state.buildings, ...facilities] };
}

export const ALL_FACILITIES_DEMAND = { power: 22, water: 2 };
