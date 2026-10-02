import { createBuilding } from './buildingSpecs';
import { GAME_CONFIG } from './config';
import { hashSeed } from './random';
import { generateSeed } from './seed';
import type { GameState } from './state';

export interface NewGameOptions {
  seed?: string;
  now: number;
}

export function newGame(options: NewGameOptions): GameState {
  const seed = options.seed ?? generateSeed(options.now);
  const { firstEntityId, startingBuildings, startingParcels, startingRoadRow, startingUrbs } = GAME_CONFIG;
  return {
    seed,
    rngState: hashSeed(seed),
    urbs: startingUrbs,
    lastSeen: options.now,
    nextId: firstEntityId + startingBuildings.length,
    ownedParcels: startingParcels.map((parcel) => ({ ...parcel })),
    buildings: startingBuildings.map((building, index) => createBuilding(firstEntityId + index, building.type, building.x, building.y, building.rotation)),
    storage: { materials: {}, goods: {} },
    storehouseLevel: 0,
    marketUnlocked: false,
    market: {},
    roads: Array.from({ length: startingRoadRow.toX - startingRoadRow.fromX + 1 }, (_, index) => ({
      x: startingRoadRow.fromX + index,
      y: startingRoadRow.y,
      kind: 'road' as const,
    })),
    roundabouts: [],
  };
}
