import { useState } from 'react';
import { SLOT_PRICES, isItemUnlocked, minTierOf, producibleItems, productionTierOf, recipeOf, unlockCitizensOf, type Building, type ItemId, type MaterialId } from '../../core';
import { t } from '../../i18n/t';
import { isPack, itemName } from '../../i18n/itemName';
import { formatDuration } from '../common/formatDuration';
import { useGame } from '../common/hooks';
import { gameStore } from '../../store/gameStore';
import { UrbsAmount } from '../common/UrbsAmount';
import { ActionButton } from '../common/ActionButton';
import { ButtonRow } from '../common/ButtonRow';
import { CheckboxField } from '../common/CheckboxField';
import { SlotList } from '../common/SlotList';
import { DrawerPanel } from '../common/DrawerPanel';

interface ProductionPanelProps {
  building: Building;
}

export function ProductionPanel({ building }: ProductionPanelProps) {
  const state = useGame((store) => store.state);
  const now = state.lastSeen;
  const items = [...producibleItems(building.type)];
  const [onlyCraftable, setOnlyCraftable] = useState(false);
  const hasFreeSlot = building.queue.length < building.slotCount;
  const hasReadyOutput = building.queue.some((entry) => entry.done);
  const send = gameStore.getState().send;
  const slotPrice = building.slotCount < productionTierOf(building).maxSlots ? SLOT_PRICES[building.slotCount + 1] : undefined;

  function lockLabel(item: ItemId): string {
    const conditions = [
      ...(isItemUnlocked(state, item) ? [] : [`${unlockCitizensOf(item)} ${t('stat.citizens')}`]),
      ...(building.tier >= minTierOf(item) ? [] : [`${t('home.tier')} ${minTierOf(item)}`]),
    ];
    return conditions.join(' · ');
  }

  const isAvailable = (item: ItemId) => isItemUnlocked(state, item) && building.tier >= minTierOf(item);
  const lacksMaterials = (item: ItemId) => building.type === 'packhouse' && Object.entries(recipeOf(item)).some(([material, amount]) => (state.storage.materials[material as MaterialId] ?? 0) < amount);

  const canFilter = building.type === 'packhouse' && items.some((item) => isAvailable(item) && !lacksMaterials(item));
  const filtering = canFilter && onlyCraftable;

  return <DrawerPanel>
      <DrawerPanel.Title title={`${t('panel.queue')} · ${t('home.tier')}`} level={building.tier}/>
      <SlotList>
        {Array.from({ length: building.slotCount }, (_, index) => {
          const entry = building.queue[index];
          if (!entry) return <SlotList.Slot key={index} status="free">{t('panel.freeSlot')}</SlotList.Slot>;
          const status = entry.done
            ? t('panel.ready')
            : entry.startedAt === null
              ? t('panel.waiting')
              : formatDuration(entry.startedAt + entry.duration - now);
          return (
            <SlotList.Slot key={index} status={entry.done ? 'ready' : undefined}>
              <span>{itemName(entry.item)}</span>
              <span>{status}</span>
            </SlotList.Slot>
          );
        })}
      </SlotList>
      {hasFreeSlot && canFilter ? (
        <CheckboxField label={t('panel.onlyCraftable')} checked={onlyCraftable} onChange={setOnlyCraftable} />
      ) : null}
      {hasFreeSlot ? (
        <ButtonRow align="stretch" spaced>
          {items.filter((item) => !filtering || !lacksMaterials(item)).map((item) =>
            isAvailable(item) ? (
              <ActionButton key={item} disabled={lacksMaterials(item)} onClick={() => send({ type: 'QueueProduction', buildingId: building.id, item })}>
                {itemName(item)}
                {recipeLabel(item)}
              </ActionButton>
            ) : (
              <ActionButton key={item} disabled>
                🔒 {itemName(item)} ({lockLabel(item)})
              </ActionButton>
            ),
          )}
        </ButtonRow>
      ) : null}
      {slotPrice !== undefined ? (
        <ActionButton block onClick={() => send({ type: 'BuySlot', buildingId: building.id })}>
          {t('panel.buySlot')} (<UrbsAmount value={slotPrice} />)
        </ActionButton>
      ) : null}
      <DrawerPanel.Upgrade building={building} />
      {hasReadyOutput ? (
        <ActionButton variant="primary" block onClick={() => send({ type: 'Collect', buildingId: building.id })}>
          {t('panel.collect')}
        </ActionButton>
      ) : null}
  </DrawerPanel>;
}

function recipeLabel(item: ItemId): string {
  if (isPack(item)) return '';
  const parts = Object.entries(recipeOf(item)).map(([material, amount]) => `${amount} ${t(`item.${material as MaterialId}`)}`);
  return parts.length > 0 ? ` (${parts.join(', ')})` : '';
}
