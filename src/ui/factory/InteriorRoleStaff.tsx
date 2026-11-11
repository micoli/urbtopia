import { STAFF, hireFeeOf, hiredInteriorOf, interiorPostsOf, minTierOfInteriorRole, type Building, type InteriorRole } from '../../core';
import { t } from '../../i18n/t';
import { gameStore } from '../../store/gameStore';
import { ActionButton } from '../common/ActionButton';
import { UrbsAmount } from '../common/UrbsAmount';

interface InteriorRoleStaffProps {
  building: Building;
  role: InteriorRole;
}

// A role of an interior, hired like the Staff of a Venue: a fee once, a wage by the day, and the part of the effect it carries.
export function InteriorRoleStaff({ building, role }: InteriorRoleStaffProps) {
  const hired = hiredInteriorOf(building.interior, role);
  const posts = interiorPostsOf(building.type, role, building.tier);
  const locked = posts === 0;
  const send = gameStore.getState().send;
  return (
    <div className="venue-staff">
      <div className="venue-staff__label">
        <strong>{t(`interior.role.${role}`)} · {hired}/{posts}</strong>
        <span className="note note--muted">{t(`interior.roleEffect.${role}`)} · <UrbsAmount value={STAFF.dailyWage[role]} /> {t('venue.wage')}</span>
        <span className="note note--muted">{locked ? `${t('venue.tierNeeded')} ${minTierOfInteriorRole(building.type, role)}` : <>{t('venue.hireFee')} <UrbsAmount value={hireFeeOf(role)} /></>}</span>
      </div>
      <div className="venue-staff__actions">
        <ActionButton aria-label={`${t('venue.release')} ${t(`interior.role.${role}`)}`} disabled={hired === 0} onClick={() => send({ type: 'ReleaseInteriorStaff', buildingId: building.id, role })}>−</ActionButton>
        <ActionButton aria-label={`${t('venue.hire')} ${t(`interior.role.${role}`)}`} disabled={hired >= posts || locked} onClick={() => send({ type: 'HireInteriorStaff', buildingId: building.id, role })}>+</ActionButton>
      </div>
    </div>
  );
}
