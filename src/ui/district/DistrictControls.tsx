import { useState } from 'react';
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
  const [confirmGiveUp, setConfirmGiveUp] = useState(false);
  const [showLesson, setShowLesson] = useState(false);
  const send = gameStore.getState().send;
  const underWay = view.game !== undefined && !view.over;
  const canUndo = view.game !== undefined && view.game.placements.length > 1;

  const startGame = () => {
    send({ type: 'StartDistrictGame', buildingId: building.id });
    districtStore.getState().clearDraft();
  };
  const undo = () => {
    send({ type: 'UndoDistrictHex', buildingId: building.id });
    districtStore.getState().clearDraft();
  };
  const giveUp = () => {
    setConfirmGiveUp(false);
    send({ type: 'GiveUpDistrictGame', buildingId: building.id });
    districtStore.getState().clearDraft();
  };

  return (
    <>
      <ActionButton disabled={!canUndo} onClick={undo}><Icon name="undo" /> {t('district.undo')}</ActionButton>
      {underWay ? (
        <>
          <ActionButton variant="danger" onClick={() => setConfirmGiveUp(true)}>{t('district.giveUp')}</ActionButton>
        </>
      ) : (
        <ActionButton variant="primary" onClick={startGame}><Icon name="play" /> {t('district.newGame')}</ActionButton>
      )}
      <ActionButton onClick={() => setShowLesson(true)}><Icon name="info" /> {t('district.howToPlay')}</ActionButton>
      {showLesson ? <DistrictDemonstrationDialog onClose={() => setShowLesson(false)} /> : null}
      {confirmGiveUp ? <DistrictGiveUpDialog onStay={() => setConfirmGiveUp(false)} onGiveUp={giveUp} /> : null}
    </>
  );
}
