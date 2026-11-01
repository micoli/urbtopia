import { afterAll, beforeAll } from 'vitest';
import { KNOWLEDGE } from '../services/knowledge';
import { createBuilding } from '../buildings/buildingSpecs';
import type { Coord } from '../map/coord';
import { FACILITIES, FACILITY_TYPES } from '../services/facilities';
import type { GameState } from './state';

export function withAllServices(state: GameState, near: Coord): GameState {
  const facilities = FACILITY_TYPES.map((type, index) => createBuilding(state.nextId + index, type, near.x, near.y + 4, 0));
  return { ...state, nextId: state.nextId + facilities.length, buildings: [...state.buildings, ...facilities] };
}

export const ALL_FACILITIES_DEMAND = FACILITY_TYPES.reduce((total, type) => ({ power: total.power + FACILITIES[type].power, water: total.water + FACILITIES[type].water }), { power: 0, water: 0 });

// For tests of something else than Knowledge: the schools and Libraries they build must not move their numbers.
export function withoutKnowledgeEffects(): void {
  const saved = { ...KNOWLEDGE.effects };
  beforeAll(() => {
    for (const effect of Object.keys(KNOWLEDGE.effects) as (keyof typeof KNOWLEDGE.effects)[]) KNOWLEDGE.effects[effect] = 0;
  });
  afterAll(() => {
    Object.assign(KNOWLEDGE.effects, saved);
  });
}
