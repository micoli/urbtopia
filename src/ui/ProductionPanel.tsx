import { producibleItems, type Building } from '../core';
import { t } from '../i18n/t';
import { formatDuration } from './formatDuration';
import { useGame } from './hooks';
import { gameStore } from '../store/gameStore';

interface ProductionPanelProps {
  building: Building;
}

export function ProductionPanel({ building }: ProductionPanelProps) {
  const now = useGame((store) => store.state.lastSeen);
  const items = producibleItems(building.type);
  const hasFreeSlot = building.queue.length < building.slotCount;
  const hasReadyOutput = building.queue.some((entry) => entry.done);
  const send = gameStore.getState().send;

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
          {items.map((item) => (
            <button key={item} type="button" onClick={() => send({ type: 'QueueProduction', buildingId: building.id, item })}>
              + {t(`item.${item}`)}
            </button>
          ))}
        </div>
      ) : null}
      {hasReadyOutput ? (
        <button type="button" className="collect-button" onClick={() => send({ type: 'Collect', buildingId: building.id })}>
          {t('panel.collect')}
        </button>
      ) : null}
    </section>
  );
}
