import { useMemo } from 'react';
import { useStore } from 'zustand';
import { FLAG_IDS, featureFlagStore, type FlagValues } from '../featureFlags/featureFlags';
import { cloudEnabled } from '../persistence/cloud/cloudConfig';

// The features an Achievement may need: the beta features the player switched on, and the Cloud when this build has one.
export const featuresOf = (enabled: FlagValues): ReadonlySet<string> => new Set([...FLAG_IDS.filter((id) => enabled[id]), ...(cloudEnabled ? ['cloud'] : [])]);

export const availableFeatures = (): ReadonlySet<string> => featuresOf(featureFlagStore.getState().enabled);

export const useAvailableFeatures = (): ReadonlySet<string> => {
  const enabled = useStore(featureFlagStore, (store) => store.enabled);
  return useMemo(() => featuresOf(enabled), [enabled]);
};
