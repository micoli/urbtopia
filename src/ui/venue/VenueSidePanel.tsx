import { useVenueFixtureSelected, VenueFixturePanel } from './VenueFixturePanel';

interface VenueSidePanelProps {
  venueId: number;
}

export function VenueSidePanel({ venueId }: VenueSidePanelProps) {
  const selected = useVenueFixtureSelected(venueId);
  if (!selected) return null;
  return (
    <aside className="side-panel">
      <VenueFixturePanel venueId={venueId} />
    </aside>
  );
}
