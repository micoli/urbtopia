import { MAX_SLOTS, SLOT_PRICES, isItemUnlocked, producibleItems, recipeOf, unlockCitizensOf, type Building, type ItemId, type MaterialId } from '../core';
import { t } from '../i18n/t';
import { formatDuration } from './formatDuration';
import { useGame } from './hooks';
import { gameStore } from '../store/gameStore';

interface ProductionPanelProps {
  building: Building;
}

export function ProductionPanel({ building }: ProductionPanelProps) {
  const state = useGame((store) => store.state);
  const now = state.lastSeen;
  const items = producibleItems(building.type);
  const hasFreeSlot = building.queue.length < building.slotCount;
  const hasReadyOutput = building.queue.some((entry) => entry.done);
  const send = gameStore.getState().send;
  const slotPrice = building.slotCount < MAX_SLOTS ? SLOT_PRICES[building.slotCount + 1] : undefined;

  return (
    <section className="production">
      <h3>{t('panel.queue')}</h3>
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
              <span>{t(`item.${entry.item}`)}</span>
              <span>{status}</span>
            </li>
          );
        })}
      </ol>
      {hasFreeSlot ? (
        <div className="slot-actions">
          {items.map((item) =>
            isItemUnlocked(state, item) ? (
              <button key={item} type="button" onClick={() => send({ type: 'QueueProduction', buildingId: building.id, item })}>
                + {t(`item.${item}`)}
                {recipeLabel(item)}
              </button>
            ) : (
              <button key={item} type="button" disabled>
                🔒 {t(`item.${item}`)} ({unlockCitizensOf(item)} {t('stat.citizens')})
              </button>
            ),
          )}
        </div>
      ) : null}
      {slotPrice !== undefined ? (
        <button type="button" className="slot-buy" onClick={() => send({ type: 'BuySlot', buildingId: building.id })}>
          {t('panel.buySlot')} ({slotPrice} {t('stat.urbs')})
        </button>
      ) : null}
      {hasReadyOutput ? (
        <button type="button" className="collect-button" onClick={() => send({ type: 'Collect', buildingId: building.id })}>
          {t('panel.collect')}
        </button>
      ) : null}
    </section>
  );
}

function recipeLabel(item: ItemId): string {
  const parts = Object.entries(recipeOf(item)).map(([material, amount]) => `${amount} ${t(`item.${material as MaterialId}`)}`);
  return parts.length > 0 ? ` (${parts.join(', ')})` : '';
}
