import { ARCADE_FIXTURES } from './fixtures';
import type { VenueData, VenueFixture } from '../engine/state';

export const LAYOUT = {
  withoutCounterRate: 0.5,
  counterDistancePenalty: 0.06,
  minCounterRate: 0.6,
  farCounterDistance: 3,
  noisePenaltyPerPair: 0.08,
  minAttractiveness: 0.5,
  seatsPerHost: 4,
  playsPerSeat: 2,
};

export type LayoutHint = 'counterFar' | 'noise' | 'noHost';

export interface Layout {
  counterRate: number;
  attractiveness: number;
  seatedIds: ReadonlySet<number>;
  hints: ReadonlyMap<number, readonly LayoutHint[]>;
}

type Cell = { x: number; y: number };

const tilesOf = (fixture: VenueFixture): Cell[] => {
  const [width, depth] = ARCADE_FIXTURES[fixture.type].footprint;
  const [w, d] = fixture.rotation % 2 === 0 ? [width, depth] : [depth, width];
  return Array.from({ length: w * d }, (_, index) => ({ x: fixture.x + (index % w), y: fixture.y + Math.floor(index / w) }));
};

const gap = (a: Cell, b: Cell): number => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
const distanceBetween = (a: VenueFixture, b: VenueFixture): number => Math.min(...tilesOf(a).flatMap(first => tilesOf(b).map(second => gap(first, second))));

export function layoutOf(venue: VenueData, entrance: Cell): Layout {
  const hints = new Map<number, LayoutHint[]>();
  const addHint = (id: number, hint: LayoutHint) => hints.set(id, [...(hints.get(id) ?? []), hint]);
  const fixtures = venue.fixtures;

  const counters = fixtures.filter(fixture => fixture.type === 'counter');
  const distances = counters.map(counter => Math.min(...tilesOf(counter).map(tile => gap(tile, entrance))));
  const nearest = distances.length ? Math.min(...distances) : null;
  const counterRate = nearest === null ? LAYOUT.withoutCounterRate : Math.max(LAYOUT.minCounterRate, 1 - LAYOUT.counterDistancePenalty * (nearest - 1));
  counters.forEach((counter, index) => {
    if (distances[index]! > LAYOUT.farCounterDistance) addHint(counter.id, 'counterFar');
  });

  const loud = fixtures.filter(fixture => ARCADE_FIXTURES[fixture.type].loud);
  let noisyPairs = 0;
  const noisy = new Set<number>();
  loud.forEach((first, index) => {
    for (const second of loud.slice(index + 1)) {
      if (distanceBetween(first, second) !== 1) continue;
      noisyPairs++;
      noisy.add(first.id);
      noisy.add(second.id);
    }
  });
  noisy.forEach(id => addHint(id, 'noise'));
  const attractiveness = Math.max(LAYOUT.minAttractiveness, 1 - LAYOUT.noisePenaltyPerPair * noisyPairs);

  const load = new Map<number, number>();
  const seatedIds = new Set<number>();
  for (const seat of fixtures.filter(fixture => fixture.type === 'chair' || fixture.type === 'barStool')) {
    const hosts = fixtures
      .filter(host => host.type === 'table' || (seat.type === 'barStool' && host.type === 'counter'))
      .filter(host => distanceBetween(seat, host) === 1 && (load.get(host.id) ?? 0) < LAYOUT.seatsPerHost)
      .sort((a, b) => (load.get(a.id) ?? 0) - (load.get(b.id) ?? 0));
    const host = hosts[0];
    if (!host) {
      addHint(seat.id, 'noHost');
      continue;
    }
    load.set(host.id, (load.get(host.id) ?? 0) + 1);
    seatedIds.add(seat.id);
  }
  return { counterRate, attractiveness, seatedIds, hints };
}
