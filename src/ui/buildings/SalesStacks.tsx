import { SHOP, canSell, isShopType, saleIntervalOf, sellableGoodsOf, shopTierOf, stackSaleProgress, stacksOf, type Building, type ShopStack } from '../../core';
import { t } from '../../i18n/t';
import { itemName } from '../../i18n/itemName';
import { gameStore } from '../../store/gameStore';
import { formatDuration } from '../common/formatDuration';
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
  const now = useGame((store) => store.state.lastSeen);
  const send = gameStore.getState().send;
  const stacks = stacksOf(building);
  const selling = stacks.filter((stack) => stack.good !== null && stack.stock > 0);
  const hasFreeSlot = stacks.some((stack) => stack.stock === 0);
  const sellable = sellableGoodsOf(building);
  const stockable = sellable.filter((good) => canSell(building, good) && (stock[good] ?? 0) >= SHOP.stackSize);
  const listed = isShopType(building.type) ? shopTierOf(building).sells : sellable;
  const sellsPacks = sellable.length > listed.length;

  return <>
    <Note tone="muted">{t('shop.sells')}: {[...listed.map(itemName), ...(sellsPacks ? [t('shop.packs')] : [])].join(', ')}</Note>
    <SlotList>
      {selling.map((stack, index) => (
        <SlotList.Slot key={index} progress={isWaiting(stack) ? undefined : stackSaleProgress(stack, now, saleIntervalOf(building, stack.good))}>
          <span>
            {itemName(stack.good!)} {SHOP.stackSize - stack.stock}/{SHOP.stackSize}
          </span>
          {stack.nextSaleAt === null ? null : <span>{formatDuration(stack.nextSaleAt - now)}</span>}
        </SlotList.Slot>
      ))}
      {Array.from({ length: stacks.length - selling.length }, (_, index) => (
        <SlotList.Slot key={`free-${index}`} status="free">{t('panel.freeSlot')}</SlotList.Slot>
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

const isWaiting = (stack: ShopStack): boolean => stack.stock > 0 && stack.nextSaleAt === null;
