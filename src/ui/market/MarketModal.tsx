import { useModalFocus } from '../stats/management/useModalFocus';
import { useUi } from '../common/hooks';
import { MarketContent } from './MarketContent';

export function MarketModal() {
  const open = useUi((store) => store.marketOpen);
  const toggle = useUi((store) => store.toggleMarket);
  const dialog = useModalFocus(open, toggle);
  if (!open) return null;
  return (
    <div
      className="dialog-backdrop"
      onClick={(event) => {
        if (event.target === event.currentTarget) toggle();
      }}
    >
      <div className="dialog market-dialog" ref={dialog} tabIndex={-1} role="dialog" aria-modal="true">
        <MarketContent />
      </div>
    </div>
  );
}
