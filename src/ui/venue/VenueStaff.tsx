import { STAFF, hireFeeOf, hiredOf, isVenue, minTierOfRole, postsOf, staffRolesOf, venueTypeOf } from '../../core';
import { t } from '../../i18n/t';
import { gameStore } from '../../store/gameStore';
import { ActionButton } from '../common/ActionButton';
import { useGame } from '../common/hooks';
import { UrbsAmount } from '../common/UrbsAmount';

interface VenueStaffProps {
  venueId: number;
}

export function VenueStaff({ venueId }: VenueStaffProps) {
  const building = useGame(store => store.state.buildings.find(candidate => candidate.id === venueId));
  if (!building || !isVenue(building)) return null;
  const send = gameStore.getState().send;
  return (
    <section className="venue-build" aria-label={t('venue.staff')}>
      <div className="venue-build__items">
        {staffRolesOf(venueTypeOf(building)).map(role => {
          const hired = hiredOf(building.venue, role);
          const posts = postsOf(role, building.tier);
          const locked = posts === 0;
          return (
            <div key={role} className="venue-staff">
              <div className="venue-staff__label">
                <strong>{t(`venue.role.${role}`)} · {hired}/{posts}</strong>
                <span className="note note--muted">{t(`venue.roleEffect.${role}`)} · <UrbsAmount value={STAFF.dailyWage[role]} /> {t('venue.wage')}</span>
                <span className="note note--muted">
                  {locked ? `${t('venue.tierNeeded')} ${minTierOfRole(role)}` : <>{t('venue.hireFee')} <UrbsAmount value={hireFeeOf(role)} /></>}
                </span>
              </div>
              <div className="venue-staff__actions">
                <ActionButton aria-label={`${t('venue.release')} ${t(`venue.role.${role}`)}`} disabled={hired === 0} onClick={() => send({ type: 'ReleaseStaff', buildingId: venueId, role })}>−</ActionButton>
                <ActionButton aria-label={`${t('venue.hire')} ${t(`venue.role.${role}`)}`} disabled={hired >= posts || locked} onClick={() => send({ type: 'HireStaff', buildingId: venueId, role })}>+</ActionButton>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
