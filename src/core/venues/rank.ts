import type { VenueData, VenueType } from '../engine/state';
import { VENUE_PROFILES } from './profiles';

export const MAX_RANK = 3;

export const earnedOf = (venue: VenueData): number => venue.earned ?? 0;

// A Venue earns its Rank by trading: it never costs Urbs, and it is kept when the building is upgraded.
export const rankOf = (type: VenueType, venue: VenueData): number => 1 + VENUE_PROFILES[type].rankAt.filter(threshold => earnedOf(venue) >= threshold).length;

export const nextRankAt = (type: VenueType, rank: number): number | undefined => VENUE_PROFILES[type].rankAt[rank - 1];
