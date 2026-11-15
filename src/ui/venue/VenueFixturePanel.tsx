import { useStore } from 'zustand';
import { t } from '../../i18n/t';
import { venueStore } from '../../store/venueStore';
import { PanelHeader } from '../common/PanelHeader';
import { fixturePageIdOf } from '../../codex/fixturePages';
import { CodexLinkButton } from '../buildings/CodexLinkButton';
import { useGame, useUi } from '../common/hooks';
import { VenueFixtureActions } from './VenueFixtureActions';
import {PanelSection} from "../buildings/PanelSection.tsx";

interface VenueFixturePanelProps {
  venueId: number;
}

// Shown only while a Fixture of the interior is selected, as the panel of a building is in the city.
export function useVenueFixtureSelected(venueId: number): boolean {
  const placedId = useStore(venueStore, store => store.placedId);
  const movingId = useStore(venueStore, store => store.movingId);
  return useGame(store => {
    const building = store.state.buildings.find(candidate => candidate.id === venueId);
    return Boolean((building?.venue?.fixtures ?? building?.interior?.fixtures)?.some(fixture => fixture.id === (movingId ?? placedId)));
  });
}

export function VenueFixturePanel({ venueId }: VenueFixturePanelProps) {
  const selectPlaced = useStore(venueStore, store => store.selectPlaced);
  const stopMove = useStore(venueStore, store => store.stopMove);
  const placedId = useStore(venueStore, store => store.placedId);
  const movingId = useStore(venueStore, store => store.movingId);
  const openCodex = useUi(store => store.openCodex);
  const fixture = useGame(store => {
    const building = store.state.buildings.find(candidate => candidate.id === venueId);
    return (building?.venue?.fixtures ?? building?.interior?.fixtures)?.find(candidate => candidate.id === (movingId ?? placedId));
  });
  return (
    <>
      <PanelHeader title={t('venue.fixture.panel')} onClose={() => { stopMove(); selectPlaced(null); }} debugNode={fixture} />
      <VenueFixtureActions venueId={venueId} />
      {fixture ?
        <>
          <PanelSection id="usage" title={t('panel.section.help')}>
            <CodexLinkButton title={t(`venue.fixture.${fixture.type}`)} onOpen={() => openCodex(undefined, 'fixtures', fixturePageIdOf(fixture.type))} />
          </PanelSection>
        </> : null}
    </>
  );
}
