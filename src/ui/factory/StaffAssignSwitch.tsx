import type { Building, InteriorRole, VenueFixture } from '../../core';
import { t } from '../../i18n/t';
import { gameStore } from '../../store/gameStore';
import { SwitchField } from '../common/SwitchField';

interface StaffAssignSwitchProps {
  building: Building;
  fixture: VenueFixture;
  role: InteriorRole;
  // Why a free Staff cannot be assigned yet; an assigned Staff can always be freed.
  blocked: boolean;
}

export function StaffAssignSwitch({ building, fixture, role, blocked }: StaffAssignSwitchProps) {
  const roleName = t(`interior.role.${role}`);
  return (
    <SwitchField
      label={t('venue.assignStaff').replace('{role}', roleName)}
      description={fixture.assigned ? t('venue.assignAtWork').replace('{role}', roleName) : undefined}
      checked={Boolean(fixture.assigned)}
      disabled={!fixture.assigned && blocked}
      onChange={assigned => gameStore.getState().send({ type: assigned ? 'AssignInteriorStaff' : 'UnassignInteriorStaff', buildingId: building.id, fixtureId: fixture.id })}
    />
  );
}
