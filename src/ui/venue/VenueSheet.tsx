import { useStore } from 'zustand';
import type { Building } from '../../core';
import { venueStore } from '../../store/venueStore';
import { PanelHeader } from '../common/PanelHeader';
import { venuePanelTitle } from './venuePanelTitle';
import { VenueFixturePanel } from './VenueFixturePanel';
import { useVenueFixtureExpansion } from './useVenueFixtureExpansion';
import { VenueFixtureMiniBar } from './VenueFixtureMiniBar';
import { VenuePanelContent } from './VenuePanelContent';

interface VenueSheetProps {
  venue: Building;
}

// The bottom sheet of the bar and minimal layouts: the selected Fixture first, otherwise the panel of the menu.
export function VenueSheet({ venue }: VenueSheetProps) {
  const panel = useStore(venueStore, store => store.panel);
  const closePanel = useStore(venueStore, store => store.closePanel);
  const { fixtureType, open: fixtureOpen, expand } = useVenueFixtureExpansion(venue.id);
  if (fixtureType === null && !panel) return null;
  return (
    <section className="sheet">
      {fixtureType !== null ? (
        fixtureOpen ? <VenueFixturePanel venueId={venue.id} /> : <VenueFixtureMiniBar fixtureType={fixtureType} onExpand={expand} />
      ) : (
        <>
          {venuePanelTitle(panel) ? <PanelHeader title={venuePanelTitle(panel)} onClose={closePanel} /> : null}
          <VenuePanelContent venue={venue} />
        </>
      )}
    </section>
  );
}
