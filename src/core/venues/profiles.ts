import type { Building, VenueType } from '../engine/state';

export const VENUE_TYPES: readonly VenueType[] = ['arcade', 'supermarket', 'hotel'];

export const isVenueType = (type: string): type is VenueType => (VENUE_TYPES as readonly string[]).includes(type);

// `rankAt`: net earnings a Venue must have made since it opened to reach Rank 2 and Rank 3.
export const VENUE_PROFILES: Record<VenueType, { power: number; upgradeCosts: Record<number, number>; rankAt: readonly [number, number] }> = {
  arcade: { power: 1.5, upgradeCosts: { 2: 5000, 3: 12000 }, rankAt: [600, 2500] },
  supermarket: { power: 2, upgradeCosts: { 2: 8000, 3: 18000 }, rankAt: [1200, 5000] },
  hotel: { power: 2.5, upgradeCosts: { 2: 12000, 3: 28000 }, rankAt: [2000, 9000] },
};

export const venuePower = (building: Pick<Building, 'type' | 'tier'>): number => (isVenueType(building.type) ? VENUE_PROFILES[building.type].power * building.tier : 0);
