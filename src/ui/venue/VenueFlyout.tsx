import { useStore } from 'zustand';
import type { Building } from '../../core';
import { venueStore } from '../../store/venueStore';
import { VenuePanelContent } from './VenuePanelContent';

interface VenueFlyoutProps {
  venue: Building;
}

export function VenueFlyout({ venue }: VenueFlyoutProps) {
  const panel = useStore(venueStore, store => store.panel);
  if (!panel) return null;
  return (
    <div className="flyout">
      <VenuePanelContent venue={venue} />
    </div>
  );
}
