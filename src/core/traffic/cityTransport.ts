import type { GameState } from '../engine/state';
import { ECOLOGY } from '../environment/ecology';
import { transitNetwork, transportStatsOf } from '../transit/transport';
import { congestionStats } from './congestion';

// The lines, with the Riders the Commute allocated to them; buses run at the speed the Congestion leaves them.
export function transportStats(state: GameState, now = state.lastSeen) {
  const congestion = congestionStats(state, now);
  const network = transitNetwork(state, now, congestion.speedFactors.size > 0 ? congestion.speedFactors : undefined);
  return transportStatsOf(network, congestion.riderAllocations);
}

// Only Commuters who drive emit: Citizens who walk, cycle, ride or do not travel add nothing.
export function cityTransportStats(state: GameState, now = state.lastSeen) {
  const base = transportStats(state, now);
  return { ...base, emissions: base.emissions + congestionStats(state, now).modes.car * ECOLOGY.carEmissionsPerDriver };
}
