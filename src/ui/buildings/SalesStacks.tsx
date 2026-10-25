import { SHOP, canSell, isShopType, sellableGoodsOf, shopTierOf, stacksOf, type Building } from '../../core';
import { t } from '../../i18n/t';
import { itemName } from '../../i18n/itemName';
import { gameStore } from '../../store/gameStore';
import { useGame } from '../common/hooks';
import { ActionButton } from '../common/ActionButton';
import { ButtonRow } from '../common/ButtonRow';
import { Note } from '../common/Note';
import { SlotList } from '../common/SlotList';

interface SalesStacksProps {
  building: Building;
}

export function SalesStacks({ building }: SalesStacksProps) {
  const stock = useGame((store) => store.state.storage.goods);
  const send = gameStore.getState().send;
  const stacks = stacksOf(building);
  const hasFreeSlot = stacks.some((stack) => stack.stock === 0);
  const sellable = sellableGoodsOf(building);
  const stockable = sellable.filter((good) => canSell(building, good) && (stock[good] ?? 0) >= SHOP.stackSize);
  const listed = isShopType(building.type) ? shopTierOf(building).sells : sellable;
  const sellsPacks = sellable.length > listed.length;

  return <>
    <Note tone="muted">{t('shop.sells')}: {[...listed.map(itemName), ...(sellsPacks ? [t('shop.packs')] : [])].join(', ')}</Note>
    <SlotList>
      {stacks.map((stack, index) => (
        stack.good ? (
          <SlotList.Slot key={index} status={stack.earned > 0 ? 'ready' : undefined}>
            <span>
              {itemName(stack.good)} × {stack.stock}
            </span>
            <span>
              <strong>{t('shop.earned')}</strong>: {stack.earned}
            </span>
          </SlotList.Slot>
        ) : (
          <SlotList.Slot key={index} status="free">{t('panel.freeSlot')}</SlotList.Slot>
        )
      ))}
    </SlotList>
    {hasFreeSlot && stockable.length === 0 ? <Note tone="muted">{t('shop.needGoods')}</Note> : null}
    {hasFreeSlot ? (
      <ButtonRow align="stretch" spaced>
        {stockable.map((good) => (
          <ActionButton key={good} onClick={() => send({ type: 'StockShop', buildingId: building.id, good })}>
            + {SHOP.stackSize} {itemName(good)}
          </ActionButton>
        ))}
      </ButtonRow>
    ) : null}
  </>;
}
