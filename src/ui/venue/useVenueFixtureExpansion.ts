import { useStore } from 'zustand';
import { prefsStore } from '../../i18n/prefsStore';
import { fixtureSelectionKey, selectionExpansionStore } from '../../store/selectionExpansionStore';
import { venueStore } from '../../store/venueStore';
import { useGame } from '../common/hooks';

interface VenueFixtureExpansion {
  fixtureType: string | null;
  open: boolean;
  expand: () => void;
}

// The panel of the selected Fixture opens at once with the auto-open preference, and otherwise only once the mini bar or a double tap opened it.
export function useVenueFixtureExpansion(venueId: number): VenueFixtureExpansion {
  const placedId = useStore(venueStore, store => store.placedId);
  const movingId = useStore(venueStore, store => store.movingId);
  const autoOpenSelection = useStore(prefsStore, store => store.autoOpenSelection);
  const expandedKey = useStore(selectionExpansionStore, store => store.expandedKey);
  const fixtureId = movingId ?? placedId;
  const fixtureType = useGame(store => {
    const building = store.state.buildings.find(candidate => candidate.id === venueId);
    return (building?.venue?.fixtures ?? building?.interior?.fixtures)?.find(candidate => candidate.id === fixtureId)?.type ?? null;
  });
  const key = fixtureType !== null && fixtureId !== null ? fixtureSelectionKey(venueId, fixtureId) : null;
  return {
    fixtureType,
    open: key !== null && (autoOpenSelection || expandedKey === key),
    expand: () => {
      if (key !== null) selectionExpansionStore.getState().expand(key);
    },
  };
}
