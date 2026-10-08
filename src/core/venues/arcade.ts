import { FIXTURES } from './fixtures';
import { LAYOUT, layoutOf, type Layout } from './layout';
import { frontRate, securityRate } from './staff';
import { entranceCell, neighbourhoodVisitors, priceAcceptance } from './shared';
import { clamp01, serviceRatio, type Evaluate } from './rules';
import type { VenueData, VenueFixture } from '../engine/state';

export const ARCADE = { visitsPerCitizen: 0.2 };

const playsOf = (fixture: VenueFixture, layout: Layout): number =>
  FIXTURES[fixture.type].playsPerHour + (layout.seatedIds.has(fixture.id) ? LAYOUT.playsPerSeat : 0);

export function playsCapacityPerHour(venue: VenueData, layout?: Layout): number {
  return venue.fixtures.reduce((total, fixture) => total + (layout ? playsOf(fixture, layout) : FIXTURES[fixture.type].playsPerHour), 0);
}

export const evaluateArcade: Evaluate = (state, venue, { working, price, surge }) => {
  const layout = layoutOf(working, entranceCell(venue.tier));
  const visitors = neighbourhoodVisitors(state, venue, ARCADE.visitsPerCitizen);
  const accepted = visitors * priceAcceptance(price) * layout.attractiveness * securityRate(venue.venue, 'arcade') * surge;
  const raw = playsCapacityPerHour(working, layout);
  const capacity = raw * layout.counterRate * frontRate(venue.venue, 'arcade');
  const served = Math.min(accepted, capacity);
  const earnings = new Map<number, number>();
  const usage = new Map<number, number>();
  if (capacity > 0) {
    for (const fixture of working.fixtures) {
      const share = playsOf(fixture, layout) / raw;
      if (share === 0) continue;
      usage.set(fixture.id, served * share);
      earnings.set(fixture.id, served * share * price);
    }
  }
  const satisfaction = clamp01(0.4 * serviceRatio(accepted, capacity) + 0.3 * priceAcceptance(price) + 0.3 * layout.attractiveness * layout.counterRate);
  return { visitors, accepted, capacity, served, gross: served * price, earnings, usage, layout, satisfaction, sales: new Map() };
};
