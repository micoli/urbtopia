import { useMemo } from 'react';
import { useStore } from 'zustand';
import { FLAG_IDS, featureFlagStore, type FlagId } from './featureFlags';

export const useEnabledFlagIds = (): ReadonlySet<string> => {
  const enabled = useStore(featureFlagStore, store => store.enabled);
  return useMemo(() => new Set(FLAG_IDS.filter(id => enabled[id])), [enabled]);
};

export const useFeatureFlag = (id: FlagId): boolean => useStore(featureFlagStore, store => store.enabled[id]);
