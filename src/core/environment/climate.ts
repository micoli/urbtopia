import { industryEmissionsOf } from '../economy/productionTypes';
import { cityGreenBenefits, ECOLOGY } from './ecology';
import { energyStats } from './energy';
import { cityTransportStats } from '../traffic/cityTransport';
import type { Building, GameState } from '../engine/state';
import { wasteEmissions } from '../waste/wasteNuisance';

export function activityEmissionsOf(building: Building): number {
  return industryEmissionsOf(building.type) * building.tier;
}

const climateCache = new WeakMap<GameState, ReturnType<typeof computeClimateStats>>();

export function climateStats(state: GameState): ReturnType<typeof computeClimateStats> {
  const cached = climateCache.get(state);
  if (cached) return cached;
  const stats = computeClimateStats(state);
  climateCache.set(state, stats);
  return stats;
}

function computeClimateStats(state: GameState) {
  const energy = energyStats(state);
  const transport = cityTransportStats(state);
  const operatingRatio = (state.adaptationUntil ?? 0) > state.lastSeen ? 1 : energy.economicRatio;
  const activityEmissions = state.buildings.reduce((sum, building) => sum + activityEmissionsOf(building), 0) * operatingRatio;
  const emissions = activityEmissions + energy.emissions + transport.emissions + wasteEmissions(state);
  const cooling = cityGreenBenefits(state).cooling;
  const temperature = Math.min(ECOLOGY.maxTemperature, ECOLOGY.optimalTemperature + emissions * ECOLOGY.temperaturePerEmission * (1 - cooling / 100));
  return { activityEmissions, emissions, temperature };
}
