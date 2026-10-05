import type { GameState } from '../engine/state';
import { transportStats } from '../transit/transport';
import { congestionStats } from './congestion';

// transportStats is the coverage-based baseline; this adds the Riders won through the modal shift.
export function cityTransportStats(state: GameState, now = state.lastSeen) {
  const base = transportStats(state, now);
  const shift = congestionStats(state, now).shift;
  if (shift.total === 0) return { ...base, shiftedRiders: 0 };
  return {
    ...base,
    riders: base.riders + shift.total,
    emissions: Math.max(0, base.emissions - shift.total / 10),
    lines: base.lines.map((line) => ({ ...line, riders: line.riders + (shift.byLine.get(line.id) ?? 0) })),
    shiftedRiders: shift.total,
  };
}
