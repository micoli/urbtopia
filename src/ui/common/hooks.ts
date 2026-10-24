import { useStore } from 'zustand';
import { challengeStore, type ChallengeStore } from '../../store/challengeStore';
import { cloudStore, type CloudStore } from '../../store/cloudStore';
import { gameStore, type GameStore } from '../../store/gameStore';
import { dialogStore, type DialogStore } from '../../store/dialogStore';
import { showcaseStore, type ShowcaseStore } from '../../store/showcaseStore';
import { socialStore, type SocialStore } from '../../store/socialStore';
import { readOnlyStore } from '../../store/readOnlyStore';
import { uiStore, type UiStore } from '../../store/uiStore';
import { solidarityStore, type SolidarityStore } from '../../store/solidarityStore';

export function useSolidarity<T>(selector: (store: SolidarityStore) => T): T {
  return useStore(solidarityStore, selector);
}

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

export function useSocial<T>(selector: (store: SocialStore) => T): T {
  return useStore(socialStore, selector);
}

export function useChallenges<T>(selector: (store: ChallengeStore) => T): T {
  return useStore(challengeStore, selector);
}

export function useShowcase<T>(selector: (store: ShowcaseStore) => T): T {
  return useStore(showcaseStore, selector);
}
