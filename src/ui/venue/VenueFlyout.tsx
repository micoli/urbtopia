import { useStore } from 'zustand';
import { venueTypeOf, type Building } from '../../core';
import { venueStore } from '../../store/venueStore';
import { VenueBuildMenu } from './VenueBuildMenu';

interface VenueFlyoutProps {
  venue: Building;
}

// The left panel of the side bar layout holds the build menu only, as in the city.
export function VenueFlyout({ venue }: VenueFlyoutProps) {
  const panel = useStore(venueStore, store => store.panel);
  if (panel !== 'build') return null;
  return (
    <div className="flyout">
      <VenueBuildMenu tier={venue.tier} venueType={venueTypeOf(venue)} />
    </div>
  );
}
