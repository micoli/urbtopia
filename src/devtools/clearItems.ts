import type { GameState } from '../core';

export function clearMaterials(state: GameState): GameState {
  return { ...state, storage: { ...state.storage, materials: {} } };
}

export function clearGoods(state: GameState): GameState {
  return { ...state, storage: { ...state.storage, goods: {} } };
}

export function clearWarehouse(state: GameState): GameState {
  return clearGoods(clearMaterials(state));
}
