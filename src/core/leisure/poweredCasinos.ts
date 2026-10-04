import { economicPower } from '../environment/ecology';
import { isAdapting } from '../environment/adaptation';
import { energyStats } from '../environment/energy';
import type { Building, GameState } from '../engine/state';

const POWER_EPSILON = 1e-9;

export function isCasinoPowered(state: GameState, casino: Building, supplied: ReadonlyMap<number, number> = energyStats(state).supplied): boolean {
  if (isAdapting(state)) return true;
  return (supplied.get(casino.id) ?? 0) >= economicPower(casino) - POWER_EPSILON;
}

export function poweredCasinoIds(state: GameState, supplied?: ReadonlyMap<number, number>): ReadonlySet<number> {
  const casinos = state.buildings.filter(building => building.type === 'casino');
  if (casinos.length === 0) return new Set();
  const delivered = supplied ?? energyStats(state).supplied;
  return new Set(casinos.filter(casino => isCasinoPowered(state, casino, delivered)).map(casino => casino.id));
}
