import { ECOLOGY } from './ecology';
import { greenProfileOf } from './nature';
import type { BuildingType, GameState } from '../engine/state';
import type { climateStats } from './climate';
import type { energyStats } from './energy';
import type { cityTransportStats } from '../traffic/cityTransport';

export type HeatSource = 'activity' | 'coal' | 'backup' | 'transport';

export interface HeatContribution {
  source: HeatSource;
  impact: number;
  degrees: number;
  share: number;
}

export interface CoolingElement {
  type: BuildingType;
  count: number;
  radius: number;
  weight: number;
  share: number;
}

export interface TemperatureBreakdownInputs {
  climate: ReturnType<typeof climateStats>;
  energy: ReturnType<typeof energyStats>;
  transport: ReturnType<typeof cityTransportStats>;
  cooling: number;
  adapting: boolean;
}

const MAX_SOURCE_TIPS = 2;
const GREEN_TIP_COOLING_THRESHOLD = 50;

export function temperatureBreakdown({ climate, energy, transport, cooling, adapting }: TemperatureBreakdownInputs) {
  const degreesPerImpact = ECOLOGY.temperaturePerEmission * (1 - cooling / 100);
  const impacts: [HeatSource, number][] = [
    ['activity', climate.activityEmissions], ['coal', energy.coalEmissions], ['backup', energy.backupEmissions], ['transport', transport.emissions],
  ];
  const totalDegrees = impacts.reduce((sum, [, impact]) => sum + impact * degreesPerImpact, 0);
  const sources: HeatContribution[] = impacts.map(([source, impact]) => ({
    source, impact, degrees: impact * degreesPerImpact, share: totalDegrees > 0 ? impact * degreesPerImpact / totalDegrees : 0,
  }));
  const optimal = climate.emissions <= 0;
  const heaviest = sources.filter(contribution => contribution.degrees > 0).sort((a, b) => b.degrees - a.degrees).slice(0, MAX_SOURCE_TIPS);
  return {
    sources,
    temperature: climate.temperature,
    uncooled: Math.min(ECOLOGY.maxTemperature, ECOLOGY.optimalTemperature + climate.emissions * ECOLOGY.temperaturePerEmission),
    cooling,
    reduction: climate.emissions * ECOLOGY.temperaturePerEmission * (cooling / 100),
    optimal,
    capped: climate.temperature >= ECOLOGY.maxTemperature,
    adapting,
    tips: heaviest.map(contribution => contribution.source),
    advisesGreen: !optimal && cooling < GREEN_TIP_COOLING_THRESHOLD,
  };
}

export function coolingElements(state: GameState): CoolingElement[] {
  const groups = new Map<BuildingType, Omit<CoolingElement, 'share'>>();
  for (const building of state.buildings) {
    const profile = greenProfileOf(building.type, building.tier);
    if (!profile || profile.cooling <= 0) continue;
    const group = groups.get(building.type) ?? { type: building.type, count: 0, radius: 0, weight: 0 };
    groups.set(building.type, { ...group, count: group.count + 1, radius: Math.max(group.radius, profile.radius), weight: group.weight + profile.cooling });
  }
  const total = [...groups.values()].reduce((sum, group) => sum + group.weight, 0);
  return [...groups.values()].map(group => ({ ...group, share: group.weight / total })).sort((a, b) => b.weight - a.weight);
}
