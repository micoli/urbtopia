import { goodCategoryOf, newGoodsAtNextTier, shopTierOf, slotPriceOf, type Building } from '../../core';
import { t } from '../../i18n/t';
import { itemName } from '../../i18n/itemName';
import { gameStore } from '../../store/gameStore';
import { ActionButton } from '../common/ActionButton';
import { Note } from '../common/Note';
import { DrawerPanel } from '../common/DrawerPanel';
import { UrbsAmount } from '../common/UrbsAmount';
import { PowerShortageNote } from './PowerShortageNote';
import { SalesStacks } from './SalesStacks';

interface ShopPanelProps {
  building: Building;
}

export function ShopPanel({ building }: ShopPanelProps) {
  const send = gameStore.getState().send;
  const slotPrice = building.slotCount < shopTierOf(building).maxSlots ? slotPriceOf(building, building.slotCount + 1) : undefined;
  const nextGoods = newGoodsAtNextTier(building);

  return <DrawerPanel>
      <PowerShortageNote />
      <DrawerPanel.LabelValue label={t('shop.category')} value={t(`goodCategory.${goodCategoryOf(building)}`)} />
      {nextGoods.length > 0 ? <Note tone="muted">{t('shop.nextTier')}: {nextGoods.map(itemName).join(', ')}</Note> : null}
      <SalesStacks building={building} />
      {slotPrice !== undefined ? (
        <ActionButton block onClick={() => send({ type: 'BuySlot', buildingId: building.id })}>
          {t('panel.buySlot')} (<UrbsAmount value={slotPrice} />)
        </ActionButton>
      ) : null}
      <DrawerPanel.Upgrade building={building} />
  </DrawerPanel>
}
