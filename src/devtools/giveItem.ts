import { isGood, type GameState, type ItemId } from '../core';
import { MAX_DEV_ITEM_QUANTITY } from './giveAllItems';

export function giveItem(state: GameState, item: ItemId, quantity: number): GameState {
  if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > MAX_DEV_ITEM_QUANTITY) return state;
  if (isGood(item)) {
    const goods = { ...state.storage.goods, [item]: Math.min(Number.MAX_SAFE_INTEGER, (state.storage.goods[item] ?? 0) + quantity) };
    return { ...state, storage: { ...state.storage, goods } };
  }
  const materials = { ...state.storage.materials, [item]: Math.min(Number.MAX_SAFE_INTEGER, (state.storage.materials[item] ?? 0) + quantity) };
  return { ...state, storage: { ...state.storage, materials } };
}
