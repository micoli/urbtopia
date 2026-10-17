import { FIXTURES, GOODS, isShelf, stockOf, type GoodId, type VenueFixture } from '../../core';
import { itemName } from '../../i18n/itemName';
import { t } from '../../i18n/t';
import { gameStore } from '../../store/gameStore';
import { ActionButton } from '../common/ActionButton';
import { Dropdown } from '../common/Dropdown';
import { useGame } from '../common/hooks';

interface VenueShelfStockProps {
  venueId: number;
  fixture: VenueFixture;
}

export function VenueShelfStock({ venueId, fixture }: VenueShelfStockProps) {
  const goods = useGame(store => store.state.storage.goods);
  if (!isShelf(fixture)) return null;
  const capacity = FIXTURES[fixture.type].shelf!;
  const locked = fixture.good !== undefined && stockOf(fixture) > 0;
  const options = (Object.keys(GOODS) as GoodId[]).filter(good => Math.floor(goods[good] ?? 0) > 0 || good === fixture.good);
  const send = gameStore.getState().send;
  return (
    <>
      <p>
        <strong>{t('venue.stockLevel')}</strong>: {Math.floor(stockOf(fixture))} / {capacity}
        {fixture.good ? ` · ${itemName(fixture.good)}` : ` · ${t('venue.stockNone')}`}
      </p>
      {options.length === 0 ? <p className="note note--muted">{t('venue.stockNoGoods')}</p> : null}
      {options.length > 0 ? (
        <div className="venue-stock">
          <div className="venue-stock-good">
            <span>{t('venue.stockGood')}</span>
            <Dropdown
              label={t('venue.stockGood')}
              value={fixture.good}
              placeholder="—"
              disabled={locked}
              options={options.map(good => ({ value: good, label: `${itemName(good)} · ${Math.floor(goods[good] ?? 0)} ${t('venue.inStorage')}` }))}
              onChange={good => send({ type: 'SetShelfGood', buildingId: venueId, fixtureId: fixture.id, good })}
            />
          </div>
          <ActionButton variant="primary" disabled={!fixture.good} onClick={() => fixture.good && send({ type: 'StockShelf', buildingId: venueId, fixtureId: fixture.id, good: fixture.good })}>
            ↑ {t('venue.stockFill')}
          </ActionButton>
          <ActionButton disabled={!fixture.good} onClick={() => send({ type: 'UnstockShelf', buildingId: venueId, fixtureId: fixture.id })}>
            ↓ {t('venue.stockRemove')}
          </ActionButton>
        </div>
      ) : null}
    </>
  );
}
