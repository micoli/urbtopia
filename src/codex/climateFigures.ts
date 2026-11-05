import { cityBenefits, cityTransportStats, climateStats, coolingElements, energyStats, isAdapting, temperatureBreakdown, type GameState } from '../core';

export function climateFigures(state: GameState) {
  const energy = energyStats(state);
  const climate = climateStats(state);
  const cooling = cityBenefits(state, energy.coalRates).cooling;
  const breakdown = temperatureBreakdown({ climate, energy, transport: cityTransportStats(state), cooling, adapting: isAdapting(state) });
  return { emissions: climate.emissions, breakdown, elements: coolingElements(state) };
}
