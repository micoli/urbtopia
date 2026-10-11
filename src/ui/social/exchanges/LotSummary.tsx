import { itemName } from '../../../i18n/itemName';
import type { ItemId, TradeLine } from '../../../core';

interface LotSummaryProps {
    lot: readonly TradeLine[];
}

export function LotSummary({lot}: LotSummaryProps) {
    return <span className="lot-summary">{lot.map(line => `${line.quantity} × ${itemName(line.item as ItemId)}`).join(', ')}</span>;
}
