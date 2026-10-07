import { useStore } from 'zustand';
import { cloudStore, type CloudStore } from '../../store/cloudStore';
import { gameStore, type GameStore } from '../../store/gameStore';
import { dialogStore, type DialogStore } from '../../store/dialogStore';
import { readOnlyStore } from '../../store/readOnlyStore';
import { uiStore, type UiStore } from '../../store/uiStore';

export function useGame<T>(selector: (store: GameStore) => T): T {
  return useStore(gameStore, selector);
}

export function useUi<T>(selector: (store: UiStore) => T): T {
  return useStore(uiStore, selector);
}

export function useDialogs<T>(selector: (store: DialogStore) => T): T {
  return useStore(dialogStore, selector);
}

export function useReadOnly(): boolean {
  return useStore(readOnlyStore, (store) => store.readOnly);
}

export function useCloud<T>(selector: (store: CloudStore) => T): T {
  return useStore(cloudStore, selector);
}
