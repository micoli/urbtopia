import type { ReactNode } from 'react';
import { cityBenefits, cityTransportStats, climateStats, congestionStats, energyStats, type GameState } from '../src/core';
import { useGame } from '../src/ui/common/hooks';

export interface CityStatsBundle {
  state: GameState;
  energy: ReturnType<typeof energyStats>;
  green: ReturnType<typeof cityBenefits>;
  transport: ReturnType<typeof cityTransportStats>;
  climate: ReturnType<typeof climateStats>;
  congestion: ReturnType<typeof congestionStats>;
}

export function WithCityStats({ children }: { children: (stats: CityStatsBundle) => ReactNode }) {
  const state = useGame((store) => store.state);
  const energy = energyStats(state);
  return <>{children({ state, energy, green: cityBenefits(state, energy.coalRates), transport: cityTransportStats(state), climate: climateStats(state), congestion: congestionStats(state) })}</>;
}
