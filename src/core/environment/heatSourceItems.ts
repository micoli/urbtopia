import { ECOLOGY } from './ecology';
import type { climateStats } from './climate';
import { activityEmissionsOf } from './climate';
import type { energyStats } from './energy';
import type { HeatSource } from './temperatureBreakdown';
import type { Building, GameState, TransitMode } from '../engine/state';
import type { cityTransportStats } from '../traffic/cityTransport';

export type HeatItem =
  | { kind: 'building'; building: Building; impact: number; degrees: number }
  | { kind: 'line'; lineId: number; mode: TransitMode; stop?: Building; impact: number; degrees: number }
  | { kind: 'citizens'; impact: number; degrees: number };

export interface HeatSourceItemsInputs {
  climate: ReturnType<typeof climateStats>;
  energy: ReturnType<typeof energyStats>;
  transport: ReturnType<typeof cityTransportStats>;
  cooling: number;
}

type ItemWithoutDegrees = HeatItem extends infer Item ? Item extends HeatItem ? Omit<Item, 'degrees'> : never : never;

export function heatSourceItems(state: GameState, { climate, energy, transport, cooling }: HeatSourceItemsInputs): Record<HeatSource, HeatItem[]> {
  const degreesPerImpact = ECOLOGY.temperaturePerEmission * (1 - cooling / 100);
  const rank = (items: ItemWithoutDegrees[]): HeatItem[] => items
    .filter(item => item.impact > 1e-9)
    .map(item => ({ ...item, degrees: item.impact * degreesPerImpact }) as HeatItem)
    .sort((a, b) => b.impact - a.impact);

  const rawActivity = state.buildings.reduce((sum, building) => sum + activityEmissionsOf(building), 0);
  const operatingRatio = rawActivity > 0 ? climate.activityEmissions / rawActivity : 0;
  const backupPlants = state.buildings.filter(building => building.type === 'backup');
  const lineImpact = transport.lines.reduce((sum, line) => sum + line.emissions, 0);

  return {
    activity: rank(state.buildings.map(building => ({ kind: 'building', building, impact: activityEmissionsOf(building) * operatingRatio }))),
    coal: rank(state.buildings.map(building => ({ kind: 'building', building, impact: (energy.coalRates.get(building.id) ?? 0) * ECOLOGY.coalEmissions }))),
    backup: rank(backupPlants.map(building => ({ kind: 'building', building, impact: energy.backupEmissions / backupPlants.length }))),
    transport: rank([
      ...transport.lines.map(line => ({
        kind: 'line' as const, lineId: line.id, mode: line.mode, impact: line.emissions,
        stop: state.buildings.find(building => building.id === line.stops[0]),
      })),
      { kind: 'citizens', impact: transport.emissions - lineImpact },
    ]),
  };
}
