import type { GameState } from '../engine/state';
import { ECOLOGY } from '../environment/ecology';
import { transportStats } from '../transit/transport';
import { congestionStats } from './congestion';

// transportStats is the coverage-based baseline; this adds the Riders won through the modal shift.
// Only Commuters who drive emit: Citizens who walk, cycle, ride or do not travel add nothing.
export function cityTransportStats(state: GameState, now = state.lastSeen) {
  const congestion = congestionStats(state, now);
  const base = transportStats(state, now, congestion.speedFactors.size > 0 ? congestion.speedFactors : undefined);
  const shift = congestion.shift;
  const drivers = Math.max(0, congestion.modes.car - shift.total);
  const emissions = base.emissions + drivers * ECOLOGY.carEmissionsPerDriver;
  if (shift.total === 0) return { ...base, emissions, shiftedRiders: 0 };
  return {
    ...base,
    riders: base.riders + shift.total,
    emissions,
    lines: base.lines.map((line) => ({ ...line, riders: line.riders + (shift.byLine.get(line.id) ?? 0) })),
    shiftedRiders: shift.total,
  };
}
