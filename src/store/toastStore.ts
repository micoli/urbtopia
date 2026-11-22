import { createStore } from 'zustand/vanilla';
import type { GameEvent, GameState, ItemId } from '../core';
import type { MessageKey } from '../i18n/messages';
import type { IconName } from '../ui/common/iconRegistry';
import { t } from '../i18n/t';

export interface ToastStore {
  toast: MessageKey | null;
  text: string | null;
  // The building a toast is about: the player can jump to it.
  target: number | null;
  // The Good a toast shows as an icon after its text.
  item: ItemId | null;
  // The Icon a text toast opens with.
  icon: IconName | null;
  show: (key: MessageKey, item?: ItemId) => void;
  showText: (text: string, target?: number, icon?: IconName) => void;
  dismiss: () => void;
}

export const toastStore = createStore<ToastStore>((set) => ({
  toast: null,
  text: null,
  target: null,
  item: null,
  icon: null,
  show: (key, item) => set({ toast: key, text: null, target: null, item: item ?? null, icon: null }),
  showText: (text, target, icon) => set({ toast: null, text, target: target ?? null, item: null, icon: icon ?? null }),
  dismiss: () => set({ toast: null, text: null, target: null, item: null, icon: null }),
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
  const title = building.attraction?.gathering?.title ?? building.attraction?.lastGathering?.title;
  const name = title ? `${t(`building.${building.type}`)} · ${t(`pirateShow.${title}`)}` : t(`building.${building.type}`);
  if (event.type === 'GatheringSettled') return { text: t('toast.gatheringSettled').replace('{building}', name).replace('{crowd}', `${Math.round(event.crowd)}`).replace('{amount}', `${Math.round(event.revenue)}`), target: building.id };
  if (event.type === 'GatheringEnded') return { text: t('toast.gatheringEnded').replace('{building}', name), target: building.id };
  const gathering = building.attraction?.gathering;
  return { text: t(gathering?.kind === 'show' ? 'toast.showStarted' : gathering?.kind === 'meeting' ? 'toast.meetingStarted' : 'toast.matchStarted').replace('{building}', name).replace('{crowd}', `${Math.round(gathering?.crowd ?? 0)}`), target: building.id };
}

const GATHERING_TOASTS: readonly (MessageKey | null)[] = ['event.gatheringStarted', 'event.gatheringEnded', 'event.gatheringSettled'];

function producedItem(events: readonly GameEvent[]): ItemId | undefined {
  const event = events.find((candidate) => candidate.type === 'ProductionCompleted');
  return event?.type === 'ProductionCompleted' ? event.item : undefined;
}

export function achievementToast(ids: readonly string[]): string {
  const [first] = ids;
  if (ids.length === 1 && first) return t('achievements.unlocked').replace('{name}', t(`achievement.${first}.name` as MessageKey));
  return t('achievements.unlockedMany').replace('{count}', String(ids.length));
}

export function announceSeededAchievements(count: number): void {
  toastStore.getState().showText(t('achievements.seeded').replace('{count}', String(count)), undefined, 'trophy');
}

export function announceMedal(category: string): void {
  toastStore.getState().showText(t('achievements.medal').replace('{name}', t(`achievementCategory.${category}` as MessageKey)), undefined, 'medal');
}

// Shows the toast of a batch of events; a Gathering's names its building, which the player can jump to.
export function announceEvents(events: readonly GameEvent[], state: GameState): void {
  const unlocked = events.flatMap((event) => (event.type === 'AchievementUnlocked' ? [event.id] : []));
  if (unlocked.length > 0) return toastStore.getState().showText(achievementToast(unlocked), undefined, 'trophy');
  const key = toastKeyForEvents(events as GameEvent[]);
  if (!key) return;
  const gathering = GATHERING_TOASTS.includes(key) ? gatheringToast(events, state) : null;
  if (gathering) toastStore.getState().showText(gathering.text, gathering.target);
  else toastStore.getState().show(key, key === 'event.productionCompleted' ? producedItem(events) : undefined);
}
