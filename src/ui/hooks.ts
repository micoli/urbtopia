import { useStore } from 'zustand';
import { gameStore, type GameStore } from '../store/gameStore';
import { uiStore, type UiStore } from '../store/uiStore';

export function useGame<T>(selector: (store: GameStore) => T): T {
  return useStore(gameStore, selector);
}

export function useUi<T>(selector: (store: UiStore) => T): T {
  return useStore(uiStore, selector);
}
