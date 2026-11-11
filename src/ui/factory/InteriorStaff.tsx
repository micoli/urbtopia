import { STAFF, hireFeeOf, minTierOfTechnician, technicianPostsOf, type Building } from '../../core';
import { t } from '../../i18n/t';
import { gameStore } from '../../store/gameStore';
import { InteriorRestocker } from './InteriorRestocker';
import { ActionButton } from '../common/ActionButton';
import { UrbsAmount } from '../common/UrbsAmount';

interface InteriorStaffProps {
  factory: Building;
}

// The only Staff of a Factory interior is the Technician, who repairs worn Fixtures by the hour and slows their wear.
export function InteriorStaff({ factory }: InteriorStaffProps) {
  const hired = factory.interior?.technicians ?? 0;
  const posts = technicianPostsOf(factory.tier);
  const locked = posts === 0;
  const send = gameStore.getState().send;
  return (
    <section className="venue-build" aria-label={t('venue.staff')}>
      <div className="venue-build__items">
        <div className="venue-staff">
          <div className="venue-staff__label">
            <strong>{t('venue.role.technician')} · {hired}/{posts}</strong>
            <span className="note note--muted">{t('venue.roleEffect.technician')} · <UrbsAmount value={STAFF.dailyWage.technician} /> {t('venue.wage')}</span>
            <span className="note note--muted">{locked ? `${t('venue.tierNeeded')} ${minTierOfTechnician()}` : <>{t('venue.hireFee')} <UrbsAmount value={hireFeeOf('technician')} /></>}</span>
          </div>
          <div className="venue-staff__actions">
            <ActionButton aria-label={`${t('venue.release')} ${t('venue.role.technician')}`} disabled={hired === 0} onClick={() => send({ type: 'ReleaseInteriorTechnician', buildingId: factory.id })}>−</ActionButton>
            <ActionButton aria-label={`${t('venue.hire')} ${t('venue.role.technician')}`} disabled={hired >= posts || locked} onClick={() => send({ type: 'HireInteriorTechnician', buildingId: factory.id })}>+</ActionButton>
          </div>
        </div>
        {factory.type === 'packhouse' ? <InteriorRestocker packhouse={factory} /> : null}
      </div>
    </section>
  );
}
