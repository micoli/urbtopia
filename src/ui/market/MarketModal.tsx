import { t } from '../../i18n/t';
import { useModalFocus } from '../stats/management/useModalFocus';
import { useUi } from '../common/hooks';
import { PanelHeader } from '../common/PanelHeader';
import { EventsContent } from './EventsContent';
import { MarketContent } from './MarketContent';
import { MarketTabs } from './MarketTabs';

export function MarketModal() {
  const open = useUi((store) => store.marketOpen);
  const toggle = useUi((store) => store.toggleMarket);
  const tab = useUi((store) => store.marketTab);
  const setTab = useUi((store) => store.setMarketTab);
  const dialog = useModalFocus(open, toggle);
  if (!open) return null;
  return (
    <div
      className="dialog-backdrop"
      onClick={(event) => {
        if (event.target === event.currentTarget) toggle();
      }}
    >
      <div className="dialog market-dialog" ref={dialog} tabIndex={-1} role="dialog" aria-modal="true" aria-label={t('dock.market')}>
        <PanelHeader title={t('dock.market')} onClose={toggle} />
        <MarketTabs tab={tab} onSelect={setTab} />
        <div id="market-panel" role="tabpanel" aria-labelledby={`market-tab-${tab}`}>
          {tab === 'events' ? <EventsContent /> : <MarketContent />}
        </div>
      </div>
    </div>
  );
}
