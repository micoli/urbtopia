import { farmTier } from '../economy/tiers';
import { CROPS, type CropId } from './crops';
import { isCropUnlocked } from '../progression/unlocks';
import type { CommandOutcome } from '../engine/commands';
import type { GameState } from '../engine/state';

export function seedStockUsed(state: GameState): number {
  return Object.values(state.seedStock).reduce<number>((total, amount) => total + (amount ?? 0), 0);
}

export function seedStockCapacity(state: GameState): number {
  const farm = state.buildings.find((building) => building.type === 'farm');
  return farm ? farmTier(farm).seedCapacity : 0;
}

export function buySeeds(state: GameState, crop: CropId, quantity: number): CommandOutcome {
  if (!state.buildings.some((building) => building.type === 'farm')) return { key: 'error.noFarm' };
  if (!(crop in CROPS)) return { key: 'error.unknownCommand' };
  if (!Number.isInteger(quantity) || quantity < 1) return { key: 'error.invalidQuantity' };
  if (!isCropUnlocked(state, crop)) return { key: 'error.itemLocked' };
  const room = seedStockCapacity(state) - seedStockUsed(state);
  if (room < 1) return { key: 'error.seedStockFull' };
  const bought = Math.min(quantity, room);
  const cost = bought * CROPS[crop].seedPrice;
  if (state.urbs < cost) return { key: 'error.notEnoughUrbs' };
  return {
    state: { ...state, urbs: state.urbs - cost, seedStock: { ...state.seedStock, [crop]: (state.seedStock[crop] ?? 0) + bought } },
    events: [],
  };
}
