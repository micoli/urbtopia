import { createBuilding, newGame, type GameState } from '../../../src/core';

export const SIM_URBS = 100_000;
export const SIM_CASINO_ID = 1;

export function simCity(tier: number): GameState {
  const casino = { ...createBuilding(SIM_CASINO_ID, 'casino', 55, 50, 0), tier };
  return {
    ...newGame({ seed: 'casino-sim', now: Date.now() }),
    urbs: SIM_URBS,
    nextId: 10,
    tutorial: null,
    adaptationUntil: Number.MAX_SAFE_INTEGER,
    buildings: [casino],
  };
}
