import { useStore } from 'zustand';
import { featureFlagStore } from '../../featureFlags/featureFlags';

export function useBetaSubscribed(): boolean {
  return useStore(featureFlagStore, (store) => store.subscribed);
}
