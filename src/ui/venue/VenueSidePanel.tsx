import { useStore } from 'zustand';
import type { Building } from '../../core';
import { venueStore } from '../../store/venueStore';
import { PanelHeader } from '../common/PanelHeader';
import { useVenueFixtureSelected, VenueFixturePanel } from './VenueFixturePanel';
import { VenuePanelContent } from './VenuePanelContent';
import { venuePanelTitle } from './venuePanelTitle';

interface VenueSidePanelProps {
  venue: Building;
}

// The right panel of the side bar layout, as the panel of a building in the city: the selected Fixture, or the staff, the
// events or the takings. Only one is open at a time.
export function VenueSidePanel({ venue }: VenueSidePanelProps) {
  const panel = useStore(venueStore, store => store.panel);
  const closePanel = useStore(venueStore, store => store.closePanel);
  const selected = useVenueFixtureSelected(venue.id);
  const title = venuePanelTitle(panel);
  if (selected) {
    return (
      <aside className="side-panel">
        <VenueFixturePanel venueId={venue.id} />
      </aside>
    );
  }
  if (!title) return null;
  return (
    <aside className="side-panel">
      <PanelHeader title={title} onClose={closePanel} />
      <VenuePanelContent venue={venue} />
    </aside>
  );
}
