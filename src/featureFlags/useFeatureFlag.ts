import { useStore } from 'zustand';
import { featureFlagStore, type FlagId } from './featureFlags';

export const useFeatureFlag = (id: FlagId): boolean => useStore(featureFlagStore, store => store.enabled[id]);
