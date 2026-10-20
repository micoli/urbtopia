import economy from '../../../assets/defs/balance/economy.json' with { type: 'json' };
import { BUILDING_ENTRIES, tiersOf } from '../buildings/buildingDefinitions';
import type { OfficeType } from '../buildings/buildingTypes.generated';
import type { Building } from '../engine/state';

const HOUR_MS = 3_600_000;

export const OFFICE = { ...economy.office, hourMs: HOUR_MS };

export const OFFICE_TYPES: readonly OfficeType[] = BUILDING_ENTRIES.filter(({ kind }) => kind === 'office').map(({ id }) => id as OfficeType);

export const isOfficeType = (type: string): type is OfficeType => (OFFICE_TYPES as readonly string[]).includes(type);

type OfficeBuilding = Pick<Building, 'type' | 'tier'>;

export interface OfficeTier {
  jobs: number;
  power: number;
}

export function officeTierOf(building: OfficeBuilding): OfficeTier {
  const tiers = tiersOf(building.type as OfficeType);
  const { jobs, power } = tiers[building.tier - 1] ?? tiers[0]!;
  return { jobs: jobs!, power: power! };
}

// The Jobs-milliseconds an Office has stored are kept in `taxCitizenMs`, like the Citizen-milliseconds of a Home.
export function advanceOffice(building: Building, filledJobs: number, elapsedMs: number): Building {
  if (!isOfficeType(building.type) || elapsedMs <= 0) return building;
  const cap = officeTierOf(building).jobs * OFFICE.capHours * OFFICE.hourMs;
  return { ...building, taxCitizenMs: Math.min(cap, building.taxCitizenMs + filledJobs * elapsedMs) };
}

// `yieldMultiplier` is the one an Ordinance gives to the Urbs the Jobs earn.
export function officeUrbsDue(building: Building, yieldMultiplier = 1): number {
  return Math.floor((building.taxCitizenMs * OFFICE.urbsPerJobPerHour * yieldMultiplier) / OFFICE.hourMs);
}
