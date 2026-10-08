import { useEffect } from 'react';
import { useStore } from 'zustand';
import { venueTypeOf } from '../../core';
import { t } from '../../i18n/t';
import { sceneHandle } from '../../store/sceneHandle';
import { venueStore } from '../../store/venueStore';
import { useGame } from '../common/hooks';
import { VenueCanvas } from './VenueCanvas';
import { VenueMenus } from './VenueMenus';

export function VenueDialog() {
  const venueId = useStore(venueStore, store => store.venueId);
  const venue = useGame(store => (venueId === null ? undefined : store.state.buildings.find(building => building.id === venueId)));
  const open = venueId !== null && venue !== undefined;

  useEffect(() => {
    if (!open) return;
    sceneHandle.current?.setPaused(true);
    return () => sceneHandle.current?.setPaused(false);
  }, [open]);

  // Escape closes what is open, one thing at a time, then leaves the Venue.
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      const { movingId, placedId, selectedFixture, panel, stopMove, selectPlaced, selectFixture, closePanel, close } = venueStore.getState();
      if (movingId !== null) return stopMove();
      if (placedId !== null) return selectPlaced(null);
      if (selectedFixture) return selectFixture(null);
      if (panel) return closePanel();
      close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  if (!open) return null;
  return (
    <div className="venue-view" role="dialog" aria-modal="true" aria-label={t('venue.manage')}>
      <VenueCanvas venueId={venueId} venueType={venueTypeOf(venue)} />
      <h2 className="venue-view__title">{t(`building.${venue.type}`)}</h2>
      <VenueMenus venue={venue} />
    </div>
  );
}
