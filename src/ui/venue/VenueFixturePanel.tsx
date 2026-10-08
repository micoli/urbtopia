import { useStore } from 'zustand';
import { t } from '../../i18n/t';
import { venueStore } from '../../store/venueStore';
import { PanelHeader } from '../common/PanelHeader';
import { useGame } from '../common/hooks';
import { VenueFixtureActions } from './VenueFixtureActions';

interface VenueFixturePanelProps {
  venueId: number;
}

// Shown only while a Fixture of the interior is selected, as the panel of a building is in the city.
export function useVenueFixtureSelected(venueId: number): boolean {
  const placedId = useStore(venueStore, store => store.placedId);
  const movingId = useStore(venueStore, store => store.movingId);
  return useGame(store => {
    const building = store.state.buildings.find(candidate => candidate.id === venueId);
    return Boolean(building?.venue?.fixtures.some(fixture => fixture.id === (movingId ?? placedId)));
  });
}

export function VenueFixturePanel({ venueId }: VenueFixturePanelProps) {
  const selectPlaced = useStore(venueStore, store => store.selectPlaced);
  const stopMove = useStore(venueStore, store => store.stopMove);
  return (
    <>
      <PanelHeader title={t('venue.fixture.panel')} onClose={() => { stopMove(); selectPlaced(null); }} />
      <VenueFixtureActions venueId={venueId} />
    </>
  );
}
