import { useState } from 'react';
import { SLOT_PRICES, hasCounter, isItemUnlocked, minTierOf, producibleItems, productionDurationOf, productionTierOf, recipeMultiplierOf, recipeOf, rushPrice, unlockCitizensOf, type Building, type ItemId, type MaterialId, type QueueEntry } from '../../core';
import { t } from '../../i18n/t';
import { itemName } from '../../i18n/itemName';
import { formatDuration } from '../common/formatDuration';
import { useGame } from '../common/hooks';
import { gameStore } from '../../store/gameStore';
import { UrbsAmount } from '../common/UrbsAmount';
import { ActionButton } from '../common/ActionButton';
import { BlockedReason } from '../common/BlockedReason';
import { ButtonRow } from '../common/ButtonRow';
import { FirstUseHint } from '../common/FirstUseHint';
import { CheckboxField } from '../common/CheckboxField';
import { SlotList } from '../common/SlotList';
import { DrawerPanel } from '../common/DrawerPanel';
import { PowerShortageNote } from './PowerShortageNote';
import { RecipeLabel } from './RecipeLabel';
import { SalesStacks } from './SalesStacks';
import { Icon } from '../common/Icon';

interface ProductionPanelProps {
  building: Building;
}

export function ProductionPanel({ building }: ProductionPanelProps) {
  const state = useGame((store) => store.state);
  const now = state.lastSeen;
  const items = [...producibleItems(building.type)];
  const [onlyCraftable, setOnlyCraftable] = useState(false);
  const hasFreeSlot = building.queue.length < building.slotCount;
  const counter = hasCounter(building.type);
  const hasReadyOutput = building.queue.some((entry) => entry.done) || building.stacks.some((stack) => stack.earned > 0);
  const send = gameStore.getState().send;
  const slotPrice = building.slotCount < productionTierOf(building).maxSlots ? SLOT_PRICES[building.slotCount + 1] : undefined;

  function lockLabel(item: ItemId): string {
    const conditions = [
      ...(isItemUnlocked(state, item) ? [] : [`${unlockCitizensOf(item)} ${t('stat.citizens')}`]),
      ...(building.tier >= minTierOf(item) ? [] : [`${t('home.tier')} ${minTierOf(item)}`]),
    ];
    return conditions.join(' · ');
  }

  const multiplier = recipeMultiplierOf(building);
  const isAvailable = (item: ItemId) => isItemUnlocked(state, item) && building.tier >= minTierOf(item);
  const lacksMaterials = (item: ItemId) => Object.entries(recipeOf(item)).some(([material, amount]) => (state.storage.materials[material as MaterialId] ?? 0) < amount * multiplier);

  const canFilter = building.type === 'packhouse' && items.some((item) => isAvailable(item) && !lacksMaterials(item));
  const filtering = canFilter && onlyCraftable;

  return <DrawerPanel>
      <PowerShortageNote />
      <FirstUseHint id="production">{t('hint.production')}</FirstUseHint>
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
            <SlotList.Slot key={index} status={entry.done ? 'ready' : undefined} progress={slotProgress(entry, now)}>
              <span>{itemName(entry.item)}</span>
              <span>{status}</span>
              {isRunning(entry) ? (
                <ActionButton className="slot-rush" disabled={state.urbs < rushPrice(entry, now)} onClick={() => send({ type: 'RushProduction', buildingId: building.id })}>
                  {t('panel.rush')} (<UrbsAmount value={rushPrice(entry, now)} />)
                </ActionButton>
              ) : null}
            </SlotList.Slot>
          );
        })}
      </SlotList>
      {!hasFreeSlot && <BlockedReason reason={t('blocked.slotsFull')} />}
      {hasFreeSlot && canFilter ? (
        <CheckboxField label={t('panel.onlyCraftable')} checked={onlyCraftable} onChange={setOnlyCraftable} />
      ) : null}
      {hasFreeSlot ? (
        <ButtonRow align="stretch" spaced>
          {items.filter((item) => !filtering || !lacksMaterials(item)).map((item) =>
            isAvailable(item) ? (
              <ActionButton key={item} aria-disabled={lacksMaterials(item) || undefined} onClick={() => !lacksMaterials(item) && send({ type: 'QueueProduction', buildingId: building.id, item })}>
                {itemName(item)}
                <RecipeLabel item={item} materials={state.storage.materials} multiplier={multiplier} /> · {formatDuration(productionDurationOf(building, item))}
              </ActionButton>
            ) : (
              <ActionButton key={item} disabled>
                <Icon name="lock" /> {itemName(item)} ({lockLabel(item)})
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
      {counter ? <><h4>{t('shop.counter')}</h4><SalesStacks building={building} /></> : null}
      {hasReadyOutput ? (
        <ActionButton variant="primary" block onClick={() => send({ type: 'Collect', buildingId: building.id })}>
          {t('panel.collect')}
        </ActionButton>
      ) : null}
  </DrawerPanel>;
}

const isRunning = (entry: QueueEntry): boolean => !entry.done && entry.startedAt !== null;

function slotProgress(entry: QueueEntry, now: number): number {
  if (entry.done) return 1;
  if (entry.startedAt === null) return 0;
  return Math.min(1, Math.max(0, (now - entry.startedAt) / entry.duration));
}
