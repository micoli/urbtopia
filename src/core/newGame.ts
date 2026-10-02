import { GAME_CONFIG } from './config';
import { hashSeed } from './random';
import type { GameState } from './state';

export interface NewGameOptions {
  seed: string;
  now: number;
}

export function newGame({ seed, now }: NewGameOptions): GameState {
  return {
    seed,
    rngState: hashSeed(seed),
    urbs: GAME_CONFIG.startingUrbs,
    lastSeen: now,
    nextId: GAME_CONFIG.startingBuildings.length + 1,
    ownedParcels: GAME_CONFIG.startingParcels.map((p) => ({ ...p })),
    buildings: GAME_CONFIG.startingBuildings.map((b, index) => ({ id: index + 1, rotation: 0, ...b })),
  };
}
