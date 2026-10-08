import { useStore } from 'zustand';
import { venueTypeOf, type Building } from '../../core';
import { venueStore } from '../../store/venueStore';
import { VenueBuildMenu } from './VenueBuildMenu';
import { VenueEvents } from './VenueEvents';
import { VenueStaff } from './VenueStaff';
import { VenueTakings } from './VenueTakings';

interface VenuePanelContentProps {
  venue: Building;
}

// What the panel opened from the main menu shows.
export function VenuePanelContent({ venue }: VenuePanelContentProps) {
  const panel = useStore(venueStore, store => store.panel);
  if (panel === 'build') return <VenueBuildMenu tier={venue.tier} venueType={venueTypeOf(venue)} />;
  if (panel === 'staff') return <VenueStaff venueId={venue.id} />;
  if (panel === 'events') return <VenueEvents venueId={venue.id} />;
  if (panel === 'takings') return <VenueTakings building={venue} editable />;
  return null;
}
