import { isCoveLocked, seatsOfStands, type Building } from '../../core';
import { t } from '../../i18n/t';
import { BlockedReason } from '../common/BlockedReason';
import { DrawerPanel } from '../common/DrawerPanel';
import { Icon } from '../common/Icon';
import { useGame } from '../common/hooks';

export function StandsPanel({ building }: { building: Building }) {
  const locked = useGame((store) => isCoveLocked(store.state, building.coveId ?? 0));
  return (
    <DrawerPanel>
      <p><Icon name="ticket" /> {t('attraction.seats')}: {seatsOfStands(building.type)}</p>
      {locked ? <BlockedReason reason={t('error.showLocksCove')} /> : null}
    </DrawerPanel>
  );
}
