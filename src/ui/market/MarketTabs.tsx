import type { KeyboardEvent } from 'react';
import type { MarketTab } from '../../store/uiStore';
import { t } from '../../i18n/t';

interface MarketTabsProps {
  tab: MarketTab;
  eventsPending: number;
  onSelect: (tab: MarketTab) => void;
}

const ORDER: MarketTab[] = ['market', 'events'];

export function MarketTabs({ tab, eventsPending, onSelect }: MarketTabsProps) {
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
    if (step === 0) return;
    event.preventDefault();
    const next = (ORDER.indexOf(tab) + step + ORDER.length) % ORDER.length;
    const target = ORDER[next];
    if (!target) return;
    onSelect(target);
    event.currentTarget.querySelectorAll<HTMLElement>('[role="tab"]')[next]?.focus();
  };

  return (
    <div className="market-tabs" role="tablist" aria-label={t('dock.market')} onKeyDown={onKeyDown}>
      {ORDER.map((id) => (
        <button key={id} type="button" role="tab" id={`market-tab-${id}`} aria-selected={tab === id} aria-controls="market-panel" tabIndex={tab === id ? 0 : -1} onClick={() => onSelect(id)}>
          {t(`market.tab.${id}`)}
          {id === 'events' && eventsPending > 0 ? <small className="market-tab-badge">{eventsPending > 9 ? '9+' : eventsPending}</small> : null}
        </button>
      ))}
    </div>
  );
}
