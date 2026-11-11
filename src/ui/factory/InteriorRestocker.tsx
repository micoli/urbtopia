import { STAFF, hireFeeOf, restockerPostsOf, type Building } from '../../core';
import { t } from '../../i18n/t';
import { gameStore } from '../../store/gameStore';
import { ActionButton } from '../common/ActionButton';
import { UrbsAmount } from '../common/UrbsAmount';

interface FloorRestockerProps {
  packhouse: Building;
}

export function FloorRestocker({ packhouse }: FloorRestockerProps) {
  const hired = packhouse.floor?.restockers ?? 0;
  const assigned = packhouse.floor?.fixtures.filter(fixture => fixture.restocker).length ?? 0;
  const posts = restockerPostsOf(packhouse.tier);
  const send = gameStore.getState().send;
  return (
    <div className="venue-staff">
      <div className="venue-staff__label">
        <strong>{t('venue.role.restocker')} · {hired}/{posts}</strong>
        <span className="note note--muted">{t('venue.roleEffect.restocker')} · <UrbsAmount value={STAFF.dailyWage.restocker} /> {t('venue.wage')}</span>
        <span className="note note--muted">{t('venue.restockerFree')} {hired - assigned} · {t('venue.hireFee')} <UrbsAmount value={hireFeeOf('restocker')} /></span>
      </div>
      <div className="venue-staff__actions">
        <ActionButton aria-label={`${t('venue.release')} ${t('venue.role.restocker')}`} disabled={hired === 0} onClick={() => send({ type: 'ReleaseFloorRestocker', buildingId: packhouse.id })}>−</ActionButton>
        <ActionButton aria-label={`${t('venue.hire')} ${t('venue.role.restocker')}`} disabled={hired >= posts} onClick={() => send({ type: 'HireFloorRestocker', buildingId: packhouse.id })}>+</ActionButton>
      </div>
    </div>
  );
}
