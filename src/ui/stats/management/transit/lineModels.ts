import { TRANSIT, type BuildingType, type GameState, type TransitMode } from '../../../../core';
import type { MessageKey } from '../../../../i18n/messages.ts';

export interface EditableLine {
  id: number;
  mode: TransitMode;
  stops: number[];
  peakHeadway: number;
  offPeakHeadway: number;
}

export const TRANSIT_MODES: readonly TransitMode[] = ['bus', 'brt', 'rail'];
export const STOP_TYPE: Record<TransitMode, BuildingType> = { bus: 'busStop', brt: 'brtStation', rail: 'railStation' };
export const MODE_LABEL: Record<TransitMode, MessageKey> = { bus: 'transit.bus', brt: 'transit.brt', rail: 'transit.rail' };
export const MODE_ICON: Record<TransitMode, string> = { bus: '🚌', brt: '🚍', rail: '🚆' };
export const DEFAULT_PEAK_HEADWAY = 5;
export const DEFAULT_OFF_PEAK_HEADWAY = 12;

export const HEADWAY_LIMITS = {
  brt: { peak: [5, 10], offPeak: [10, 15] },
  rail: { peak: [1, 60], offPeak: [1, 60] },
} as const;

export const unlockOf = (mode: TransitMode): number => (mode === 'bus' ? 0 : TRANSIT[mode].unlock);

export function findLine(state: GameState, id: number | undefined): EditableLine | undefined {
  if (id === undefined) return undefined;
  const bus = state.busLines?.find(line => line.id === id);
  if (bus) return { id, mode: 'bus', stops: bus.stops, peakHeadway: DEFAULT_PEAK_HEADWAY, offPeakHeadway: DEFAULT_OFF_PEAK_HEADWAY };
  return state.transitLines?.find(line => line.id === id);
}
