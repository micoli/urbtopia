import { createBuilding } from '../buildings/buildingSpecs';
import { GAME_CONFIG } from './config';
import { hashSeed } from './random';
import { generateSeed } from './seed';
import type { GameState } from './state';
import { TUTORIAL_STEPS } from '../progression/tutorial';

export interface NewGameOptions {
  seed?: string;
  now: number;
  tutorial?: boolean;
}

export function newGame(options: NewGameOptions): GameState {
  const seed = options.seed ?? generateSeed(options.now);
  const empty: GameState = {
    brtRoads: [], rails: [], transitLines: [], transitFleet: [],
    busLines: [],
    adaptationUntil: options.now + 24 * 3_600_000,
    seed,
    rngState: hashSeed(seed),
    urbs: 0,
    lastSeen: options.now,
    nextId: GAME_CONFIG.firstEntityId,
    ownedParcels: GAME_CONFIG.startingParcels.map((parcel) => ({ ...parcel })),
    buildings: [],
    storage: { materials: {}, goods: {} },
    marketUnlocked: false,
    market: {},
    roads: [],
    roundabouts: [],
    tutorial: null,
  };
  if (!options.tutorial) return withStartingCity(empty);
  const { startingUrbs, startingWood } = GAME_CONFIG.tutorial;
  return { ...empty, urbs: startingUrbs, storage: { materials: { wood: startingWood }, goods: {} }, tutorial: TUTORIAL_STEPS[0] };
}

export function withStartingCity(state: GameState): GameState {
  const { firstEntityId, startingBuildings, startingRoadRow, startingUrbs } = GAME_CONFIG;
  return {
    ...state,
    urbs: startingUrbs,
    nextId: firstEntityId + startingBuildings.length,
    buildings: startingBuildings.map((building, index) => createBuilding(firstEntityId + index, building.type, building.x, building.y, building.rotation)),
    storage: { materials: {}, goods: {} },
    roads: Array.from({ length: startingRoadRow.toX - startingRoadRow.fromX + 1 }, (_, index) => ({
      x: startingRoadRow.fromX + index,
      y: startingRoadRow.y,
      kind: 'road' as const,
    })),
    tutorial: null,
  };
}
