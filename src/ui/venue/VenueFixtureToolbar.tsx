import { useEffect, useState } from 'react';
import { useStore } from 'zustand';
import { FIXTURES } from '../../core';
import { t } from '../../i18n/t';
import { venueSceneHandle } from '../../store/venueSceneHandle';
import { venueStore } from '../../store/venueStore';
import { ActionButton } from '../common/ActionButton';
import { Dialog } from '../common/Dialog';
import { useGame } from '../common/hooks';
import { Icon } from '../common/Icon';
import { IconButton } from '../common/IconButton';
import { useFloatingActions } from '../layout/useFloatingActions';
import { useFixtureCommands } from './useFixtureCommands';

interface VenueFixtureToolbarProps {
  venueId: number;
}

// Move, rotate, repair when worn and delete, each one switched in the display settings, right under the selected piece of furniture.
export function VenueFixtureToolbar({ venueId }: VenueFixtureToolbarProps) {
  const placedId = useStore(venueStore, store => store.placedId);
  const movingId = useStore(venueStore, store => store.movingId);
  const fixture = useGame(store => {
    const building = store.state.buildings.find(candidate => candidate.id === venueId);
    return (building?.venue?.fixtures ?? building?.interior?.fixtures)?.find(candidate => candidate.id === placedId);
  });
  const floating = useFloatingActions();
  const { rotate, repair, needsRepair, sell } = useFixtureCommands(venueId, fixture);
  const [anchor, setAnchor] = useState<{ x: number; y: number } | null>(null);
  const [confirmingSell, setConfirmingSell] = useState(false);

  useEffect(() => {
    const scene = venueSceneHandle.current;
    if (!scene) return;
    scene.onSelectionAnchor = setAnchor;
    return () => { scene.onSelectionAnchor = () => {}; };
  }, [venueId]);

  if (!fixture || movingId !== null || !anchor) return null;
  const canRotate = floating.rotate && !FIXTURES[fixture.type].wall;
  const canRepair = floating.repair && needsRepair;
  if (!floating.move && !canRotate && !canRepair && !floating.sell) return null;
  return (
    <>
      <div className="venue-fixture-toolbar" style={{ left: anchor.x, top: anchor.y }}>
        {floating.move ? <IconButton size="md" tone="light" label={t('venue.move')} onClick={() => venueStore.getState().startMove(fixture.id)}><Icon name="move" /></IconButton> : null}
        {canRotate ? <IconButton size="md" tone="light" label={t('venue.rotate')} onClick={rotate}><Icon name="rotateRight" /></IconButton> : null}
        {canRepair ? <IconButton size="md" tone="warning" label={t('venue.repair')} onClick={repair}><Icon name="repair" /></IconButton> : null}
        {floating.sell ? <IconButton size="md" tone="danger" label={t('panel.sell')} onClick={() => setConfirmingSell(true)}><Icon name="trash" /></IconButton> : null}
      </div>
      {confirmingSell ? (
        <Dialog role="alertdialog">
          <Dialog.Title>{t('venue.sellConfirm.title')}</Dialog.Title>
          <Dialog.Body>{t('venue.sellConfirm.body')}</Dialog.Body>
          <Dialog.Actions>
            <ActionButton onClick={() => setConfirmingSell(false)}>{t('sale.no')}</ActionButton>
            <ActionButton variant="danger" onClick={() => { setConfirmingSell(false); sell(); }}>{t('sale.yes')}</ActionButton>
          </Dialog.Actions>
        </Dialog>
      ) : null}
    </>
  );
}
