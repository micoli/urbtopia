import { FIXTURES, isItemUnlocked, isRestockable, packSizeOf, producibleItems, type Building, type GoodId, type VenueFixture } from '../../core';
import { itemName } from '../../i18n/itemName';
import { t } from '../../i18n/t';
import { gameStore } from '../../store/gameStore';
import { ActionButton } from '../common/ActionButton';
import { Dropdown } from '../common/Dropdown';
import { useGame } from '../common/hooks';

interface ExitRestockProps {
  packhouse: Building;
  fixture: VenueFixture;
}

const NONE = '';

export function ExitRestock({ packhouse, fixture }: ExitRestockProps) {
  const state = useGame(store => store.state);
  if ((packhouse.type !== 'packhouse' && packhouse.type !== 'factory') || !isRestockable(FIXTURES[fixture.type])) return null;
  const send = gameStore.getState().send;
  const size = FIXTURES[fixture.type].packSize;
  const goods = producibleItems(packhouse.type).filter(item => packhouse.type === 'factory' || packSizeOf(item) === size) as GoodId[];
  const options = [{ value: NONE, label: t('venue.restockNone') }, ...goods.map(good => ({ value: good as string, label: itemName(good), disabled: !isItemUnlocked(state, good) }))];
  const free = (packhouse.interior?.restockers ?? 0) - (packhouse.interior?.fixtures.filter(other => other.restocker).length ?? 0);
  return (
    <div className="venue-stock">
      <div className="venue-stock-good">
        <span>{t('venue.restock')}</span>
        <Dropdown
          label={t('venue.restock')}
          value={fixture.restock ?? NONE}
          options={options}
          onChange={good => send({ type: 'SetExitRestock', buildingId: packhouse.id, fixtureId: fixture.id, good: good === NONE ? null : (good as GoodId) })}
        />
      </div>
      {fixture.restocker ? <p className="note note--muted">{t('venue.restockAtWork')}</p> : null}
      {fixture.restocker
        ? <ActionButton onClick={() => send({ type: 'UnassignInteriorRestocker', buildingId: packhouse.id, fixtureId: fixture.id })}>{t('venue.restockRelease')}</ActionButton>
        : <ActionButton disabled={!fixture.restock || free <= 0} onClick={() => send({ type: 'AssignInteriorRestocker', buildingId: packhouse.id, fixtureId: fixture.id })}>{t('venue.restockAssign')}</ActionButton>}
    </div>
  );
}
