import { useMemo } from 'react';
import { assignedRoleOf, focusGoodsOf, focusOf, freeStaffOf, isItemUnlocked, isProducerRole, picksItem, type Building, type GoodId, type VenueFixture } from '../../core';
import { itemName } from '../../i18n/itemName';
import { t } from '../../i18n/t';
import { gameStore } from '../../store/gameStore';
import { Dropdown } from '../common/Dropdown';
import { useGame } from '../common/hooks';
import { ItemChoice } from './ItemChoice';
import { RestockerAssignment } from './RestockerAssignment';
import { StaffAssignSwitch } from './StaffAssignSwitch';

interface InteriorAssignmentProps {
  building: Building;
  fixture: VenueFixture;
}

const NONE = '';

// The Recipe of an Oven or the Sold Good of a Display counter of a Bakery, and the baker or the seller assigned to it.
export function InteriorAssignment({ building, fixture }: InteriorAssignmentProps) {
  const role = assignedRoleOf(fixture);
  const goods = useMemo(() => focusGoodsOf(building, fixture), [building, fixture]);
  // The Goods the city has unlocked, as one string: the panel does not draw again for every tick of the game.
  const unlocked = useGame(store => goods.filter(good => isItemUnlocked(store.state, good)).join(','));
  if (role === undefined && !picksItem(fixture)) return null;
  const send = gameStore.getState().send;
  if (role === undefined) return <ItemChoice building={building} fixture={fixture} />;
  if (role === 'restocker') return <RestockerAssignment building={building} fixture={fixture} />;
  const choice = focusOf(fixture);
  const options = [{ value: NONE, label: t('venue.assignNone') }, ...goods.map(good => ({ value: good as string, label: itemName(good), disabled: !unlocked.split(',').includes(good) }))];
  const noSupply = role === 'seller' && goods.length === 0;
  const label = t(isProducerRole(role) ? 'venue.assignRecipe' : 'venue.assignSoldGood');
  const free = freeStaffOf(building, role);
  return (
    <div className="venue-stock">
      <div className="venue-stock-good">
        <span>{label}</span>
        <Dropdown
          label={label}
          value={choice ?? NONE}
          options={options}
          onChange={good => send({ type: 'SetInteriorFocus', buildingId: building.id, fixtureId: fixture.id, good: good === NONE ? null : (good as GoodId) })}
        />
      </div>
      {noSupply ? <p className="note note--warn">{t('venue.assignNoSupply')}</p> : null}
      <StaffAssignSwitch building={building} fixture={fixture} role={role} blocked={choice === undefined || free <= 0} />
    </div>
  );
}
