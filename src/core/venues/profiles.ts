import { BUILDING_ENTRIES, definitionOf, tiersOf } from '../buildings/buildingDefinitions';
import type { Building, VenueType } from '../engine/state';

export const VENUE_TYPES: readonly VenueType[] = BUILDING_ENTRIES.filter(({ kind }) => kind === 'venue').map(({ id }) => id as VenueType);

const VENUE_SET: ReadonlySet<string> = new Set(VENUE_TYPES);

export const isVenueType = (type: string): type is VenueType => VENUE_SET.has(type);

// `rankAt`: net earnings a Venue must have made since it opened to reach Rank 2 and Rank 3.
export const VENUE_PROFILES = Object.fromEntries(VENUE_TYPES.map(type => [type, { rankAt: definitionOf(type).rankAt! }])) as unknown as Record<VenueType, { rankAt: readonly [number, number] }>;

// Everything a Venue's Tier sets: interior size, Takings cap, power, events and Staff posts.
export const venueTierOf = (type: VenueType, tier: number) => {
  const tiers = tiersOf(type);
  return tiers[tier - 1] ?? tiers[tiers.length - 1]!;
};

export const venuePower = (building: Pick<Building, 'type' | 'tier'>): number => (isVenueType(building.type) ? venueTierOf(building.type, building.tier).power! : 0);
