import { GOODS, SHOP, type Building, type GoodId } from '../core';
import { t } from '../i18n/t';
import { gameStore } from '../store/gameStore';
import { useGame } from './hooks';

interface ShopPanelProps {
  building: Building;
}

export function ShopPanel({ building }: ShopPanelProps) {
  const stock = useGame((store) => store.state.storage.goods);
  const send = gameStore.getState().send;
  const hasFreeSlot = building.stacks.some((stack) => stack.stock === 0);
  const stockable = (Object.keys(GOODS) as GoodId[]).filter((good) => (stock[good] ?? 0) >= SHOP.stackSize);

  return (
    <section className="production">
      <h3>{t('shop.stock')}</h3>
      <ol className="slots">
        {building.stacks.map((stack, index) => (
          <li key={index} className={stack.earned > 0 ? 'slot slot-ready' : 'slot'}>
            {stack.good ? (
              <>
                <span>
                  {t(`item.${stack.good}`)} × {stack.stock}
                </span>
                <span>
                    <strong>{t('shop.earned')}</strong>: {stack.earned}
                </span>
              </>
            ) : (
              <span className="slot-free">{t('panel.freeSlot')}</span>
            )}
          </li>
        ))}
      </ol>
      {hasFreeSlot && stockable.length === 0 ? <p className="hint">{t('shop.needGoods')}</p> : null}
      {hasFreeSlot ? (
        <div className="slot-actions">
          {stockable.map((good) => (
            <button key={good} type="button" onClick={() => send({ type: 'StockShop', buildingId: building.id, good })}>
              + {SHOP.stackSize} {t(`item.${good}`)}
            </button>
          ))}
        </div>
      ) : null}
    </section>
  );
}
