import { useStore } from 'zustand';
import type { Building } from '../../core';
import { venueStore } from '../../store/venueStore';
import { useVenueFixtureSelected, VenueFixturePanel } from './VenueFixturePanel';
import { VenuePanelContent } from './VenuePanelContent';

interface VenueSheetProps {
  venue: Building;
}

// The bottom sheet of the bar and minimal layouts: the selected Fixture first, otherwise the panel of the menu.
export function VenueSheet({ venue }: VenueSheetProps) {
  const panel = useStore(venueStore, store => store.panel);
  const selected = useVenueFixtureSelected(venue.id);
  if (!selected && !panel) return null;
  return (
    <section className="sheet">
      {selected ? <VenueFixturePanel venueId={venue.id} /> : <VenuePanelContent venue={venue} />}
    </section>
  );
}
