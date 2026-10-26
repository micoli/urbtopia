import { isShipmentLedgerId, type GameState } from '../core';

export type DeletionBlocker = 'challenge' | 'trade' | 'shipment';

const OPENING_EFFECTS = { 'reserve-lot': ['receive-payment', 'return-lot'], pay: ['receive-lot', 'return-payment'] } as const;

function hasOpenTradeOffer(state: GameState): boolean {
  const ledger = (state.tradeLedger ?? []).filter((entry) => !isShipmentLedgerId(entry.offerId));
  return ledger.some((entry) => {
    if (!entry.confirmed) return true;
    if (entry.effect !== 'reserve-lot' && entry.effect !== 'pay') return false;
    const settlements: readonly string[] = OPENING_EFFECTS[entry.effect];
    return !ledger.some((other) => other.offerId === entry.offerId && settlements.includes(other.effect));
  });
}

export function cityDeletionBlockers(state: GameState): DeletionBlocker[] {
  const blockers: DeletionBlocker[] = [];
  if (state.challenge !== undefined) blockers.push('challenge');
  if (hasOpenTradeOffer(state)) blockers.push('trade');
  if ((state.tradeLedger ?? []).some((entry) => isShipmentLedgerId(entry.offerId) && !entry.confirmed)) blockers.push('shipment');
  return blockers;
}
