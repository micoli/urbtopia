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

const SELL_RATIO = 0.5;

export function seedSellPrice(crop: CropId): number {
  return Math.floor(CROPS[crop].seedPrice * SELL_RATIO);
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

export function sellSeeds(state: GameState, crop: CropId, quantity: number): CommandOutcome {
  if (!state.buildings.some((building) => building.type === 'farm')) return { key: 'error.noFarm' };
  if (!(crop in CROPS)) return { key: 'error.unknownCommand' };
  if (!Number.isInteger(quantity) || quantity < 1) return { key: 'error.invalidQuantity' };
  const owned = state.seedStock[crop] ?? 0;
  if (owned < 1) return { key: 'error.noSeeds' };
  const sold = Math.min(quantity, owned);
  return {
    state: { ...state, urbs: state.urbs + sold * seedSellPrice(crop), seedStock: { ...state.seedStock, [crop]: owned - sold } },
    events: [],
  };
}
