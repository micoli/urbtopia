import { MarketContent } from './MarketContent';
import { useUi } from '../common/hooks';

export function MarketPanel() {
  const open = useUi((store) => store.marketOpen);
  if (!open) return null;
  return (
    <aside className="market-panel">
      <MarketContent />
    </aside>
  );
}
