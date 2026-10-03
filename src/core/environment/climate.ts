import { cityGreenBenefits, ECOLOGY } from './ecology';
import { energyStats } from './energy';
import { transportStats } from '../transit/transport';
import type { GameState } from '../engine/state';

export function climateStats(state: GameState) {
  const energy = energyStats(state);
  const transport = transportStats(state);
  const operatingRatio = (state.adaptationUntil ?? 0) > state.lastSeen ? 1 : energy.economicRatio;
  const activityEmissions = state.buildings.reduce((sum, building) => {
    if (building.type === 'factory') return sum + 2 * building.tier;
    if (building.type === 'workshop') return sum + 0.5 * building.tier;
    return sum;
  }, 0) * operatingRatio;
  const emissions = activityEmissions + energy.emissions + transport.emissions;
  const cooling = cityGreenBenefits(state).cooling;
  const temperature = Math.min(ECOLOGY.maxTemperature, ECOLOGY.optimalTemperature + emissions * ECOLOGY.temperaturePerEmission * (1 - cooling / 100));
  return { activityEmissions, emissions, temperature };
}
