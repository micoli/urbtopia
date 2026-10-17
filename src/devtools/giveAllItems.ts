import { GOODS, MATERIALS, type GameState } from '../core';

export const MAX_DEV_ITEM_QUANTITY = 1_000_000;

export function giveAllItems(state: GameState, quantity: number): GameState {
  if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > MAX_DEV_ITEM_QUANTITY) return state;
  const materials = { ...state.storage.materials };
  const goods = { ...state.storage.goods };
  for (const id of Object.keys(MATERIALS) as (keyof typeof MATERIALS)[]) {
    materials[id] = Math.min(Number.MAX_SAFE_INTEGER, (materials[id] ?? 0) + quantity);
  }
  for (const id of Object.keys(GOODS) as (keyof typeof GOODS)[]) {
    goods[id] = Math.min(Number.MAX_SAFE_INTEGER, (goods[id] ?? 0) + quantity);
  }
  return { ...state, storage: { materials, goods } };
}
