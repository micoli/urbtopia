import { attractionTakingsOf, type Building } from '../../core';
import { t } from '../../i18n/t';
import { gameStore } from '../../store/gameStore';
import { ActionButton } from '../common/ActionButton';
import { DrawerPanel } from '../common/DrawerPanel';
import { FirstUseHint } from '../common/FirstUseHint';
import { UrbsAmount } from '../common/UrbsAmount';

export function ArenaPanel({ building }: { building: Building }) {
  const due = Math.floor(attractionTakingsOf(building));
  return (
    <DrawerPanel>
      <FirstUseHint id="arena">{t('hint.arena')}</FirstUseHint>
      <ActionButton variant="primary" block disabled={due === 0} onClick={() => gameStore.getState().send({ type: 'Collect', buildingId: building.id })}>
        {t('attraction.collect')} · <UrbsAmount value={due} />
      </ActionButton>
    </DrawerPanel>
  );
}
