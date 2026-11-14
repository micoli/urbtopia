import { EVENT, FIXTURES, MAX_RANK, VENUE_PROFILES, fixtureIdsOf, isVenueType, type FixtureId, type VenueType } from '../core';
import type { CodexId } from './catalog';

export interface VenueRankFigure {
  rank: number;
  earnedAt: number;
  eventsOpen: boolean;
  unlockedFixtures: readonly FixtureId[];
}

export function venueRankFiguresOf(id: CodexId): VenueRankFigure[] {
  if (!isVenueType(id)) return [];
  return Array.from({ length: MAX_RANK }, (_, index) => venueRankFigure(id, index + 1));
}

function venueRankFigure(type: VenueType, rank: number): VenueRankFigure {
  const [rank2, rank3] = VENUE_PROFILES[type].rankAt;
  return {
    rank,
    earnedAt: rank === 1 ? 0 : rank === 2 ? rank2 : rank3,
    eventsOpen: rank === EVENT.minRank,
    unlockedFixtures: fixtureIdsOf(type).filter(fixtureId => (FIXTURES[fixtureId].minRank ?? 1) === rank),
  };
}
