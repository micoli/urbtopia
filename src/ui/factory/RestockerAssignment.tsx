import { assignedRoleOf, freeStaffOf, workFocusOf, type Building, type VenueFixture } from '../../core';
import { itemName } from '../../i18n/itemName';
import { t } from '../../i18n/t';
import { StaffAssignSwitch } from './StaffAssignSwitch';

interface RestockerAssignmentProps {
  building: Building;
  fixture: VenueFixture;
}

// The restocker of a Storage bin and the herder of a Collection exit: they restart the production of the item that reaches the Fixture and store it. The item is picked on the Extractor or the Pen upstream.
export function RestockerAssignment({ building, fixture }: RestockerAssignmentProps) {
  const role = assignedRoleOf(fixture) === 'herder' ? 'herder' : 'restocker';
  const item = workFocusOf(building.interior?.fixtures ?? [], fixture);
  return (
    <div className="venue-stock">
      <p className="note note--muted">{item === undefined ? t(role === 'herder' ? 'venue.exitNoItem' : 'venue.binNoItem') : t(role === 'herder' ? 'venue.exitItem' : 'venue.binItem').replace('{item}', itemName(item))}</p>
      <StaffAssignSwitch building={building} fixture={fixture} role={role} blocked={item === undefined || freeStaffOf(building, role) <= 0} />
    </div>
  );
}
