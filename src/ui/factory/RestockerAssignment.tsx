import { freeStaffOf, workFocusOf, type Building, type VenueFixture } from '../../core';
import { itemName } from '../../i18n/itemName';
import { t } from '../../i18n/t';
import { gameStore } from '../../store/gameStore';
import { ActionButton } from '../common/ActionButton';

interface RestockerAssignmentProps {
  building: Building;
  fixture: VenueFixture;
}

// The restocker of a Storage bin: he restarts the production of the item that reaches the bin and stores it. The item is picked on the Extractor upstream.
export function RestockerAssignment({ building, fixture }: RestockerAssignmentProps) {
  const send = gameStore.getState().send;
  const item = workFocusOf(building.interior?.fixtures ?? [], fixture);
  const role = t('interior.role.restocker');
  return (
    <div className="venue-stock">
      <p className="note note--muted">{item === undefined ? t('venue.binNoItem') : t('venue.binItem').replace('{item}', itemName(item))}</p>
      {fixture.assigned ? <p className="note note--muted">{t('venue.assignAtWork').replace('{role}', role)}</p> : null}
      {fixture.assigned
        ? <ActionButton onClick={() => send({ type: 'UnassignInteriorStaff', buildingId: building.id, fixtureId: fixture.id })}>{t('venue.assignRelease').replace('{role}', role)}</ActionButton>
        : <ActionButton disabled={item === undefined || freeStaffOf(building, 'restocker') <= 0} onClick={() => send({ type: 'AssignInteriorStaff', buildingId: building.id, fixtureId: fixture.id })}>{t('venue.assignStaff').replace('{role}', role)}</ActionButton>}
    </div>
  );
}
