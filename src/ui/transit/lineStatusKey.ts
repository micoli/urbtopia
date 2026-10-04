import type { LineStatus } from '../../core/transit/transitService';
import type { MessageKey } from '../../i18n/messages';

const STATUS_KEYS: Record<LineStatus, MessageKey> = {
  active: 'eco.active',
  disconnected: 'eco.disconnected',
  noFunds: 'eco.noFunds',
  noVehicle: 'eco.noVehicle',
  noEnergy: 'eco.noEnergy',
};

export const lineStatusKey = (status: LineStatus): MessageKey => STATUS_KEYS[status];
