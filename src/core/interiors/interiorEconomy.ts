import type { Building, GameState } from '../engine/state';
import { interiorPowerOfBuilding } from '../factory/interiorBonus';
import { hasProductionInterior, hasServiceInterior } from '../factory/interiorCommands';
import { restockerWagePerHour, technicianWagePerHour } from '../factory/interiorWear';
import { venuePower } from '../venues/profiles';
import { wagesPerHour } from '../venues/staff';
import { isVenue, venuePerformance } from '../venues/venues';
import type { GoodId } from '../economy/items';
import { workFocusOf } from './interiorAssignments';
import { interiorWagesPerHour } from './interiorStaff';
import { serviceFurnitureQuality } from './serviceInterior';

export type InteriorEconomyKind = 'venue' | 'production' | 'service';

export interface InteriorEconomyRow {
  building: Building;
  kind: InteriorEconomyKind;
  wagesPerHour: number;
  power: number;
  // Venue: the gross income by the hour.
  incomePerHour: number;
  // Production interior: the items its assigned Staff work on now.
  workedItems: GoodId[];
  // Service interior: the quality its furniture adds.
  quality: number;
}

const EMPTY_EFFECT = { incomePerHour: 0, quality: 0, workedItems: [] };

const hasFixtures = (building: Building): boolean => (building.interior?.fixtures.length ?? 0) > 0;

function venueRow(state: GameState, building: Building & { venue: NonNullable<Building['venue']> }): InteriorEconomyRow {
  return {
    ...EMPTY_EFFECT,
    building,
    kind: 'venue',
    wagesPerHour: wagesPerHour(building.venue),
    power: venuePower(building),
    incomePerHour: venuePerformance(state, building).grossPerHour,
  };
}

const workedItemsOf = (building: Building): GoodId[] => {
  const fixtures = building.interior?.fixtures ?? [];
  const items = fixtures.filter(fixture => fixture.assigned === true).flatMap(fixture => workFocusOf(fixtures, fixture) ?? []);
  return [...new Set(items)];
};

function productionRow(building: Building): InteriorEconomyRow {
  const technicians = (building.interior?.technicians ?? 0) * technicianWagePerHour();
  const restockers = (building.interior?.restockers ?? 0) * restockerWagePerHour();
  return {
    ...EMPTY_EFFECT,
    building,
    kind: 'production',
    wagesPerHour: interiorWagesPerHour(building) + technicians + restockers,
    power: interiorPowerOfBuilding(building),
    workedItems: workedItemsOf(building),
  };
}

function serviceRow(building: Building): InteriorEconomyRow {
  return { ...EMPTY_EFFECT, building, kind: 'service', wagesPerHour: interiorWagesPerHour(building), power: 0, quality: serviceFurnitureQuality(building) };
}

// The Venues and the interiors with Fixtures or ongoing wages, with what they cost to run and what they bring.
export function interiorEconomyRows(state: GameState): InteriorEconomyRow[] {
  return state.buildings.flatMap((building): InteriorEconomyRow[] => {
    if (isVenue(building)) return [venueRow(state, building)];
    const row = hasProductionInterior(building) ? productionRow(building) : hasServiceInterior(building) ? serviceRow(building) : undefined;
    return row && (hasFixtures(building) || row.wagesPerHour > 0) ? [row] : [];
  });
}
