import type { Building } from '../../core';
import { t } from '../../i18n/t';
import { clubStore } from '../../store/clubStore';
import { gameStore } from '../../store/gameStore';
import { ActionButton } from '../common/ActionButton';
import { DrawerPanel } from '../common/DrawerPanel';
import { ClubSummary } from './ClubSummary';

export function ClubPanel({ building }: { building: Building }) {
  if (!building.club) {
    return (
      <DrawerPanel>
        <ActionButton variant="primary" block onClick={() => gameStore.getState().send({ type: 'FoundClub', buildingId: building.id })}>{t('club.found')}</ActionButton>
      </DrawerPanel>
    );
  }
  return (
    <DrawerPanel>
      <ActionButton variant="primary" block onClick={() => clubStore.getState().open(building.id)}>{t('club.manage')}</ActionButton>
      <ClubSummary building={building} />
    </DrawerPanel>
  );
}
