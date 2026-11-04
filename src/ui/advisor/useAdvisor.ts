import { useStore } from 'zustand';
import { advisorStore, type AdvisorStore } from '../../advisor/advisorStore';

export function useAdvisor<T>(selector: (store: AdvisorStore) => T): T {
  return useStore(advisorStore, selector);
}
