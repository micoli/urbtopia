import type { TransitVehicle } from '../../../../core';
import type { MessageKey } from '../../../../i18n/messages.ts';
import type { LineSummary } from './LineMetrics.tsx';
import { lineStatusKey } from './lineStatusKey.ts';

export function vehicleStatusKey(vehicle: TransitVehicle, line: LineSummary | undefined): MessageKey {
  if (vehicle.lineId === undefined || !line) return 'transit.unassigned';
  if (line.operatingVehicleIds.includes(vehicle.id)) return 'eco.active';
  return line.status === 'active' ? 'eco.noEnergy' : lineStatusKey(line.status);
}
