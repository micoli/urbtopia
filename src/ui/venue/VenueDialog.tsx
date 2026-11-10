import { useEffect } from 'react';
import { useStore } from 'zustand';
import { fixtureVenueOf, isHomeType } from '../../core';
import { t } from '../../i18n/t';
import { sceneHandle } from '../../store/sceneHandle';
import { venueSceneHandle } from '../../store/venueSceneHandle';
import { venueStore } from '../../store/venueStore';
import { useGame } from '../common/hooks';
import { VenueCanvas } from './VenueCanvas';
import { FloorMenus } from '../factory/FloorMenus';
import { HomeMenus } from '../home/HomeMenus';
import { VenueMenus } from './VenueMenus';
import { VenueRotateButtons } from './VenueRotateButtons';

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
      const typing = event.target instanceof HTMLElement && (event.target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName));
      if (event.key === 'q' && !typing) return venueSceneHandle.current?.rotate(-1);
      if (event.key === 'e' && !typing) return venueSceneHandle.current?.rotate(1);
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
      <VenueCanvas venueId={venueId} venueType={fixtureVenueOf(venue)} />
      <h2 className="venue-view__title">{t(`building.${venue.type}`)}</h2>
      {venue.type === 'factory' ? <FloorMenus factory={venue} /> : isHomeType(venue.type) ? <HomeMenus home={venue} /> : <VenueMenus venue={venue} />}
      <VenueRotateButtons />
    </div>
  );
}
