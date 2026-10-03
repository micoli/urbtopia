import { createStore } from 'zustand/vanilla';
import type { GameEvent } from '../core';
import type { MessageKey } from '../i18n/messages';

export interface ToastStore {
  toast: MessageKey | null;
  show: (key: MessageKey) => void;
  dismiss: () => void;
}

export const toastStore = createStore<ToastStore>((set) => ({
  toast: null,
  show: (key) => set({ toast: key }),
  dismiss: () => set({ toast: null }),
}));

export function toastKeyForEvents(events: GameEvent[]): MessageKey | null {
  if (events.some((event) => event.type === 'OfflineTimeCapped')) return 'event.offlineTimeCapped';
  const unlocked = events.find((event) => event.type === 'FacilityUnlocked');
  if (unlocked) return `event.unlocked.${unlocked.facility}`;
  if (events.some((event) => event.type === 'StorageFull')) return 'event.storageFull';
  if (events.some((event) => event.type === 'BuildingUpgraded')) return 'event.buildingUpgraded';
  if (events.some((event) => event.type === 'ProductionCompleted')) return 'event.productionCompleted';
  return null;
}
