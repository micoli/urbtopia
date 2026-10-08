import type { Building, VenueType } from '../engine/state';

export const VENUE_TYPES: readonly VenueType[] = ['arcade', 'supermarket', 'hotel'];

export const isVenueType = (type: string): type is VenueType => (VENUE_TYPES as readonly string[]).includes(type);

export const VENUE_PROFILES: Record<VenueType, { power: number; upgradeCosts: Record<number, number> }> = {
  arcade: { power: 1.5, upgradeCosts: { 2: 2500, 3: 6000 } },
  supermarket: { power: 2, upgradeCosts: { 2: 3500, 3: 8000 } },
  hotel: { power: 2.5, upgradeCosts: { 2: 6000, 3: 14000 } },
};

export const venuePower = (building: Pick<Building, 'type' | 'tier'>): number => (isVenueType(building.type) ? VENUE_PROFILES[building.type].power * building.tier : 0);
