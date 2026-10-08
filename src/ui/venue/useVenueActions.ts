import { useStore } from 'zustand';
import { venueStore } from '../../store/venueStore';
import type { NavAction } from '../layout/useNavActions';
import { venueActionsOf } from './venueActions';

export function useVenueActions(): NavAction[] {
  const panel = useStore(venueStore, store => store.panel);
  return venueActionsOf(panel, venueStore.getState().togglePanel, venueStore.getState().close);
}
