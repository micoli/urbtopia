import { useState } from 'react';
import { SLOT_PRICES, isItemUnlocked, minTierOf, producibleItems, productionTierOf, recipeOf, unlockCitizensOf, type Building, type ItemId, type MaterialId } from '../../core';
import { t } from '../../i18n/t';
import { isPack, itemName } from '../../i18n/itemName';
import { formatDuration } from '../common/formatDuration';
import { useGame } from '../common/hooks';
import { gameStore } from '../../store/gameStore';
import { UpgradeSection } from '../common/UpgradeSection.tsx';
import { UrbsAmount } from '../common/UrbsAmount';
import {DrawerPanelTitle} from "../common/DrawerPanelTitle.tsx";
import {DrawerProductionPanel} from "../common/DrawerProductionPanel.tsx";

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

  return <DrawerProductionPanel>
      <DrawerPanelTitle title={`${t('panel.queue')} · ${t('home.tier')}`} level={building.tier}/>
      <ol className="slots">
        {Array.from({ length: building.slotCount }, (_, index) => {
          const entry = building.queue[index];
          if (!entry) return <li key={index} className="slot slot-free">{t('panel.freeSlot')}</li>;
          const status = entry.done
            ? t('panel.ready')
            : entry.startedAt === null
              ? t('panel.waiting')
              : formatDuration(entry.startedAt + entry.duration - now);
          return (
            <li key={index} className={entry.done ? 'slot slot-ready' : 'slot'}>
              <span>{itemName(entry.item)}</span>
              <span>{status}</span>
            </li>
          );
        })}
      </ol>
      {hasFreeSlot && canFilter ? (
        <label className="prefs-toggle">
          <input type="checkbox" checked={onlyCraftable} onChange={(event) => setOnlyCraftable(event.target.checked)} />
          {t('panel.onlyCraftable')}
        </label>
      ) : null}
      {hasFreeSlot ? (
        <div className="slot-actions">
          {items.filter((item) => !filtering || !lacksMaterials(item)).map((item) =>
            isAvailable(item) ? (
              <button key={item} type="button" disabled={lacksMaterials(item)} onClick={() => send({ type: 'QueueProduction', buildingId: building.id, item })}>
                {itemName(item)}
                {recipeLabel(item)}
              </button>
            ) : (
              <button key={item} type="button" disabled>
                🔒 {itemName(item)} ({lockLabel(item)})
              </button>
            ),
          )}
        </div>
      ) : null}
      {slotPrice !== undefined ? (
        <button type="button" className="slot-buy" onClick={() => send({ type: 'BuySlot', buildingId: building.id })}>
          {t('panel.buySlot')} (<UrbsAmount value={slotPrice} />)
        </button>
      ) : null}
      <UpgradeSection building={building} />
      {hasReadyOutput ? (
        <button type="button" className="collect-button" onClick={() => send({ type: 'Collect', buildingId: building.id })}>
          {t('panel.collect')}
        </button>
      ) : null}
  </DrawerProductionPanel>;
}

function recipeLabel(item: ItemId): string {
  if (isPack(item)) return '';
  const parts = Object.entries(recipeOf(item)).map(([material, amount]) => `${amount} ${t(`item.${material as MaterialId}`)}`);
  return parts.length > 0 ? ` (${parts.join(', ')})` : '';
}
