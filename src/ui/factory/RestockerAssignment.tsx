import { freeStaffOf, workFocusOf, type Building, type VenueFixture } from '../../core';
import { itemName } from '../../i18n/itemName';
import { t } from '../../i18n/t';
import { StaffAssignSwitch } from './StaffAssignSwitch';

interface RestockerAssignmentProps {
  building: Building;
  fixture: VenueFixture;
}

// The restocker of a Storage bin: he restarts the production of the item that reaches the bin and stores it. The item is picked on the Extractor upstream.
export function RestockerAssignment({ building, fixture }: RestockerAssignmentProps) {
  const item = workFocusOf(building.interior?.fixtures ?? [], fixture);
  return (
    <div className="venue-stock">
      <p className="note note--muted">{item === undefined ? t('venue.binNoItem') : t('venue.binItem').replace('{item}', itemName(item))}</p>
      <StaffAssignSwitch building={building} fixture={fixture} role="restocker" blocked={item === undefined || freeStaffOf(building, 'restocker') <= 0} />
    </div>
  );
}
