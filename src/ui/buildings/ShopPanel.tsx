import { SHOP, canSell, goodCategoryOf, newGoodsAtNextTier, sellableGoodsOf, shopTierOf, slotPriceOf, type Building } from '../../core';
import { t } from '../../i18n/t';
import { itemName } from '../../i18n/itemName';
import { gameStore } from '../../store/gameStore';
import { useGame } from '../common/hooks';
import { ActionButton } from '../common/ActionButton';
import { ButtonRow } from '../common/ButtonRow';
import { Note } from '../common/Note';
import { SlotList } from '../common/SlotList';
import { DrawerPanel } from '../common/DrawerPanel';
import { UrbsAmount } from '../common/UrbsAmount';

interface ShopPanelProps {
  building: Building;
}

export function ShopPanel({ building }: ShopPanelProps) {
  const stock = useGame((store) => store.state.storage.goods);
  const send = gameStore.getState().send;
  const hasFreeSlot = building.stacks.some((stack) => stack.stock === 0);
  const stockable = sellableGoodsOf(building).filter((good) => canSell(building, good) && (stock[good] ?? 0) >= SHOP.stackSize);
  const slotPrice = building.slotCount < shopTierOf(building).maxSlots ? slotPriceOf(building, building.slotCount + 1) : undefined;
  const nextGoods = newGoodsAtNextTier(building);
  const sellsPacks = sellableGoodsOf(building).length > shopTierOf(building).sells.length;

  return <DrawerPanel>
      <DrawerPanel.LabelValue label={t('shop.category')} value={t(`goodCategory.${goodCategoryOf(building)}`)} />
      <Note tone="muted">{t('shop.sells')}: {[...shopTierOf(building).sells.map(itemName), ...(sellsPacks ? [t('shop.packs')] : [])].join(', ')}</Note>
      {nextGoods.length > 0 ? <Note tone="muted">{t('shop.nextTier')}: {nextGoods.map(itemName).join(', ')}</Note> : null}
      <SlotList>
        {building.stacks.map((stack, index) => (
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
      {slotPrice !== undefined ? (
        <ActionButton block onClick={() => send({ type: 'BuySlot', buildingId: building.id })}>
          {t('panel.buySlot')} (<UrbsAmount value={slotPrice} />)
        </ActionButton>
      ) : null}
      <DrawerPanel.Upgrade building={building} />
  </DrawerPanel>
}
