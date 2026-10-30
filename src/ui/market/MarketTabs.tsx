import type { MarketTab } from '../../store/uiStore';
import { t } from '../../i18n/t';
import { Tabs } from '../common/Tabs';

interface MarketTabsProps {
  tab: MarketTab;
  eventsPending: number;
  onSelect: (tab: MarketTab) => void;
}

export function MarketTabs({ tab, eventsPending, onSelect }: MarketTabsProps) {
  const tabs = [
    { id: 'market' as const, icon: 'market' as const, label: t('market.tab.market') },
    { id: 'events' as const, icon: 'calendar' as const, label: t('market.tab.events'), count: eventsPending },
  ];
  return <Tabs label={t('dock.market')} idPrefix="market-tab" panelId="market-panel" tabs={tabs} selected={tab} onSelect={onSelect} />;
}
