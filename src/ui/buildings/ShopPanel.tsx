import { GOODS, SHOP, type Building, type GoodId } from '../../core';
import { t } from '../../i18n/t';
import { itemName } from '../../i18n/itemName';
import { gameStore } from '../../store/gameStore';
import { useGame } from '../common/hooks';
import {DrawerPanelTitle} from "../common/DrawerPanelTitle.tsx";
import {DrawerProductionPanel} from "../common/DrawerProductionPanel.tsx";
import { ActionButton } from '../common/ActionButton';
import { ButtonRow } from '../common/ButtonRow';
import { Note } from '../common/Note';
import { SlotList } from '../common/SlotList';

interface ShopPanelProps {
  building: Building;
}

export function ShopPanel({ building }: ShopPanelProps) {
  const stock = useGame((store) => store.state.storage.goods);
  const send = gameStore.getState().send;
  const hasFreeSlot = building.stacks.some((stack) => stack.stock === 0);
  const stockable = (Object.keys(GOODS) as GoodId[]).filter((good) => (stock[good] ?? 0) >= SHOP.stackSize);

  return <DrawerProductionPanel>
      <DrawerPanelTitle title={t('shop.stock')} level={building.tier}/>
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
  </DrawerProductionPanel>
}
