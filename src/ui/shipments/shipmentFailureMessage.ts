import { t } from '../../i18n/t';
import type { MessageKey } from '../../i18n/messages';
import type { ShipmentFailure } from '../../shipments/shipmentCoordinator';

const KEYS: Partial<Record<string, MessageKey>> = {
  'city-unknown': 'shipments.error.city-unknown',
  'cap-shipments-waiting': 'shipments.error.cap-shipments-waiting',
  'rate-limited': 'shipments.error.rate-limited',
  'shipment-unavailable': 'shipments.error.shipment-unavailable',
  offline: 'shipments.error.offline',
};

export function shipmentFailureMessage(failure: ShipmentFailure): string {
  if (failure.kind === 'read-only') return t('shipments.error.read-only');
  if (failure.kind === 'game') return t(failure.key);
  const minutes = Math.max(1, Math.ceil((failure.retryAfterSeconds ?? 60) / 60));
  return t(KEYS[failure.error] ?? 'shipments.error.unknown').replace('{N}', String(minutes));
}
