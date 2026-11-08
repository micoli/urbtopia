import { useStore } from 'zustand';
import { venueStore } from '../../store/venueStore';
import { useGame } from '../common/hooks';
import type { NavAction } from '../layout/useNavActions';
import type { VenueType } from '../../core';
import { venueActionsOf } from './venueActions';

export function useVenueActions(): NavAction[] {
  const panel = useStore(venueStore, store => store.panel);
  const venueId = useStore(venueStore, store => store.venueId);
  const type = useGame(store => store.state.buildings.find(building => building.id === venueId)?.type) as VenueType | undefined;
  return venueActionsOf(panel, venueStore.getState().togglePanel, venueStore.getState().close, type);
}
