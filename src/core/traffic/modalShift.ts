import { citizensOf } from '../buildings/city';
import type { GameState } from '../engine/state';
import type { transportStats } from '../transit/transport';
import type { CongestionStats } from './congestion';
import { CONGESTION } from './roadTier';

export const SHIFT = { maxFraction: 0.5, maxRiderShare: 0.9 };

export interface ModalShift {
  total: number;
  byHome: ReadonlyMap<number, number>;
  byLine: ReadonlyMap<number, number>;
}

export const NO_SHIFT: ModalShift = { total: 0, byHome: new Map(), byLine: new Map() };

export function modalShift(state: GameState, transport: ReturnType<typeof transportStats>, congestion: CongestionStats): ModalShift {
  const spare = new Map(transport.lines.map((line) => [line.id, Math.max(0, line.capacity - line.riders)]));
  const byHome = new Map<number, number>();
  const byLine = new Map<number, number>();
  let total = 0;
  const homes = state.buildings.filter((building) => building.type === 'home').sort((a, b) => a.id - b.id);
  for (const home of homes) {
    const entry = congestion.homes.get(home.id);
    const options = transport.homeLines.get(home.id);
    if (!entry || entry.disconnected || !options || entry.ratio <= 1) continue;
    const severity = Math.min(1, (entry.ratio - 1) / (CONGESTION.maxRatio - 1));
    const eligible = citizensOf(home.tier) * SHIFT.maxRiderShare - (transport.homeRiders.get(home.id) ?? 0);
    let wanted = Math.min(entry.commuters * SHIFT.maxFraction * severity, eligible);
    for (const lines of options) {
      if (wanted <= 1e-9) break;
      const moved = Math.min(wanted, ...lines.map((id) => spare.get(id) ?? 0));
      if (moved <= 1e-9) continue;
      for (const id of lines) {
        spare.set(id, (spare.get(id) ?? 0) - moved);
        byLine.set(id, (byLine.get(id) ?? 0) + moved);
      }
      byHome.set(home.id, (byHome.get(home.id) ?? 0) + moved);
      total += moved;
      wanted -= moved;
    }
  }
  return { total, byHome, byLine };
}
