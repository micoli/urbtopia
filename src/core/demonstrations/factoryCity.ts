import { createBuilding } from '../buildings/buildingSpecs';
import { newGame } from '../engine/newGame';
import type { GameState } from '../engine/state';

export const FACTORY_ID = 1;

export function factoryCity(seed: string, tier: number): GameState {
  return {
    ...newGame({ now: 1_700_000_000_000, seed, tutorial: false, venueTutorials: false }),
    urbs: 50_000,
    buildings: [{ ...createBuilding(FACTORY_ID, 'factory', 60, 56, 2), tier }],
    nextId: FACTORY_ID + 1,
  };
}
