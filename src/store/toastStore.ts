import { createStore } from 'zustand/vanilla';
import type { GameEvent, GameState } from '../core';
import type { MessageKey } from '../i18n/messages';
import { t } from '../i18n/t';

export interface ToastStore {
  toast: MessageKey | null;
  text: string | null;
  // The building a toast is about: the player can jump to it.
  target: number | null;
  show: (key: MessageKey) => void;
  showText: (text: string, target?: number) => void;
  dismiss: () => void;
}

export const toastStore = createStore<ToastStore>((set) => ({
  toast: null,
  text: null,
  target: null,
  show: (key) => set({ toast: key, text: null, target: null }),
  showText: (text, target) => set({ toast: null, text, target: target ?? null }),
  dismiss: () => set({ toast: null, text: null, target: null }),
}));

export function toastKeyForEvents(events: GameEvent[]): MessageKey | null {
  if (events.some((event) => event.type === 'OfflineTimeCapped')) return 'event.offlineTimeCapped';
  if (events.some((event) => event.type === 'PoliticsDigest')) return 'event.politicsDigest';
  if (events.some((event) => event.type === 'OrdinanceAdopted')) return 'event.ordinanceAdopted';
  if (events.some((event) => event.type === 'OrdinanceRejected')) return 'event.ordinanceRejected';
  if (events.some((event) => event.type === 'OrdinanceRepealed')) return 'event.ordinanceRepealed';
  if (events.some((event) => event.type === 'GatheringSettled')) return 'event.gatheringSettled';
  if (events.some((event) => event.type === 'GatheringEnded')) return 'event.gatheringEnded';
  if (events.some((event) => event.type === 'GatheringStarted')) return 'event.gatheringStarted';
  if (events.some((event) => event.type === 'GrantsClaimed')) return 'event.grantsClaimed';
  const unlocked = events.find((event) => event.type === 'FacilityUnlocked');
  if (unlocked) return `event.unlocked.${unlocked.facility}`;
  if (events.some((event) => event.type === 'StorageFull')) return 'event.storageFull';
  if (events.some((event) => event.type === 'BuildingUpgraded')) return 'event.buildingUpgraded';
  if (events.some((event) => event.type === 'ProductionCompleted')) return 'event.productionCompleted';
  return null;
}

function gatheringToast(events: readonly GameEvent[], state: GameState): { text: string; target: number } | null {
  const event = events.find((candidate) => candidate.type === 'GatheringSettled') ?? events.find((candidate) => candidate.type === 'GatheringEnded') ?? events.find((candidate) => candidate.type === 'GatheringStarted');
  if (!event || !('buildingId' in event)) return null;
  const building = state.buildings.find((candidate) => candidate.id === event.buildingId);
  if (!building) return null;
  const name = t(`building.${building.type}`);
  if (event.type === 'GatheringSettled') return { text: t('toast.gatheringSettled').replace('{building}', name).replace('{crowd}', `${Math.round(event.crowd)}`).replace('{amount}', `${Math.round(event.revenue)}`), target: building.id };
  if (event.type === 'GatheringEnded') return { text: t('toast.gatheringEnded').replace('{building}', name), target: building.id };
  const gathering = building.attraction?.gathering;
  return { text: t(gathering?.kind === 'show' ? 'toast.showStarted' : gathering?.kind === 'meeting' ? 'toast.meetingStarted' : 'toast.matchStarted').replace('{building}', name).replace('{crowd}', `${Math.round(gathering?.crowd ?? 0)}`), target: building.id };
}

const GATHERING_TOASTS: readonly (MessageKey | null)[] = ['event.gatheringStarted', 'event.gatheringEnded', 'event.gatheringSettled'];

// Shows the toast of a batch of events; a Gathering's names its building, which the player can jump to.
export function announceEvents(events: readonly GameEvent[], state: GameState): void {
  const key = toastKeyForEvents(events as GameEvent[]);
  if (!key) return;
  const gathering = GATHERING_TOASTS.includes(key) ? gatheringToast(events, state) : null;
  if (gathering) toastStore.getState().showText(gathering.text, gathering.target);
  else toastStore.getState().show(key);
}
