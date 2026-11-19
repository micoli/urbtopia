import { useState } from 'react';
import type { Building } from '../../core';
import { t } from '../../i18n/t';
import { districtStore } from '../../store/districtStore';
import { gameStore } from '../../store/gameStore';
import { ActionButton } from '../common/ActionButton';
import { Icon } from '../common/Icon';
import { DistrictGiveUpDialog } from './DistrictGiveUpDialog';
import type { DistrictView } from './useDistrictGame';

interface DistrictGameButtonsProps {
  building: Building;
  view: DistrictView;
}

// Start a game, or give the one under way up.
export function DistrictGameButtons({ building, view }: DistrictGameButtonsProps) {
  const [confirmGiveUp, setConfirmGiveUp] = useState(false);
  const send = gameStore.getState().send;
  const underWay = view.game !== undefined && !view.over;

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
        <ActionButton size="sm" variant="danger" onClick={() => setConfirmGiveUp(true)}>{t('district.giveUp')}</ActionButton>
      ) : (
        <ActionButton size="sm" variant="primary" onClick={startGame}><Icon name="play" /> {t('district.newGame')}</ActionButton>
      )}
      {confirmGiveUp ? <DistrictGiveUpDialog onStay={() => setConfirmGiveUp(false)} onGiveUp={giveUp} /> : null}
    </>
  );
}
