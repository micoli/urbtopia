import { useState } from 'react';
import { useStore } from 'zustand';
import type { Building } from '../../core';
import { t } from '../../i18n/t';
import { districtStore } from '../../store/districtStore';
import { gameStore } from '../../store/gameStore';
import { ActionButton } from '../common/ActionButton';
import { Icon } from '../common/Icon';
import { DistrictDemonstrationDialog } from './DistrictDemonstrationDialog';
import { DistrictGiveUpDialog } from './DistrictGiveUpDialog';
import type { DistrictView } from './useDistrictGame';

interface DistrictControlsProps {
  building: Building;
  view: DistrictView;
}

export function DistrictControls({ building, view }: DistrictControlsProps) {
  const rotation = useStore(districtStore, store => store.rotation);
  const [confirmGiveUp, setConfirmGiveUp] = useState(false);
  const [showLesson, setShowLesson] = useState(false);
  const send = gameStore.getState().send;
  const underWay = view.game !== undefined && !view.over;

  const place = () => {
    if (!view.picked?.valid) return;
    send({ type: 'PlaceDistrictHex', buildingId: building.id, cell: view.picked.cell, rotation });
    districtStore.getState().clearDraft();
  };
  const startGame = () => {
    send({ type: 'StartDistrictGame', buildingId: building.id });
    districtStore.getState().clearDraft();
  };
  const giveUp = () => {
    setConfirmGiveUp(false);
    send({ type: 'GiveUpDistrictGame', buildingId: building.id });
    districtStore.getState().clearDraft();
  };

  return (
    <>
      {underWay ? (
        <>
          <ActionButton onClick={() => districtStore.getState().rotate()}><Icon name="rotateRight" /> {t('district.rotate')}</ActionButton>
          <ActionButton variant="primary" disabled={!view.picked?.valid} onClick={place}><Icon name="check" /> {t('district.place')}</ActionButton>
          <ActionButton variant="danger" onClick={() => setConfirmGiveUp(true)}>{t('district.giveUp')}</ActionButton>
        </>
      ) : (
        <ActionButton variant="primary" onClick={startGame}><Icon name="play" /> {t('district.newGame')}</ActionButton>
      )}
      <ActionButton onClick={() => setShowLesson(true)}><Icon name="info" /> {t('district.howToPlay')}</ActionButton>
      <ActionButton onClick={() => districtStore.getState().close()}>{t('district.close')}</ActionButton>
      {showLesson ? <DistrictDemonstrationDialog onClose={() => setShowLesson(false)} /> : null}
      {confirmGiveUp ? <DistrictGiveUpDialog onStay={() => setConfirmGiveUp(false)} onGiveUp={giveUp} /> : null}
    </>
  );
}
