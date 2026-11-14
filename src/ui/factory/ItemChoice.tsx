import { useMemo } from 'react';
import { focusGoodsOf, focusOf, isItemUnlocked, type Building, type GoodId, type VenueFixture } from '../../core';
import { itemName } from '../../i18n/itemName';
import { t } from '../../i18n/t';
import { gameStore } from '../../store/gameStore';
import { Dropdown } from '../common/Dropdown';
import { useGame } from '../common/hooks';

interface ItemChoiceProps {
  building: Building;
  fixture: VenueFixture;
}

const NONE = '';

// The item that the Line of a Workshop carries, picked on its Extractor among the materials the Workshop produces.
export function ItemChoice({ building, fixture }: ItemChoiceProps) {
  const goods = useMemo(() => focusGoodsOf(building, fixture), [building, fixture]);
  const unlocked = useGame(store => goods.filter(good => isItemUnlocked(store.state, good)).join(','));
  const options = [{ value: NONE, label: t('venue.assignNone') }, ...goods.map(good => ({ value: good as string, label: itemName(good), disabled: !unlocked.split(',').includes(good) }))];
  const label = t('venue.pickItem');
  return (
    <div className="venue-stock">
      <div className="venue-stock-good">
        <span>{label}</span>
        <Dropdown
          label={label}
          value={focusOf(fixture) ?? NONE}
          options={options}
          onChange={good => gameStore.getState().send({ type: 'SetInteriorFocus', buildingId: building.id, fixtureId: fixture.id, good: good === NONE ? null : (good as GoodId) })}
        />
      </div>
    </div>
  );
}
