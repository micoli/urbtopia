import { FIXTURES } from '../venues/fixtures';
import type { Building, VenueFixture } from '../engine/state';
import { valueByTier } from '../interiors/valueByTier';
import { interiorLayoutOf } from '../interiors/interiorStaff';
import { memoizedByLayout } from './memoizedByLayout';
import { interiorReportOf, roleOf } from './interiorLinks';

// The Waste facility families of a Recycling interior: the Recyclers are the three Machines that follow a Sorter.
const RECYCLER_FAMILIES = ['shredder', 'furnace', 'crusher'] as const;

export interface RecyclingGains {
  // Waste units a day that the Exits of complete Recycling lines add to the plant's capacity.
  capacity: number;
  // Tiles that the Recyclers of complete Recycling lines add to the plant's Collection distance.
  collectionDistance: number;
  exits: number;
  recyclers: number;
  kinds: number;
}

export const NO_RECYCLING: RecyclingGains = { capacity: 0, collectionDistance: 0, exits: 0, recyclers: 0, kinds: 0 };

const recyclingStageOf = (fixture: VenueFixture, stage: number): number => {
  const family = FIXTURES[fixture.type].family;
  if (family === 'sorter') return Math.max(stage, 1);
  return stage >= 1 && (RECYCLER_FAMILIES as readonly (string | undefined)[]).includes(family) ? 2 : stage;
};

// A Recycling line is complete when Waste goes from an Intake through a Sorter, then a Recycler, to an Exit. The stage of a Fixture on a line is how far along that order the Waste is once it has gone through it:
// 0 after the Intake, 1 after a Sorter, 2 after a Recycler. Only the Exits reached at stage 2, and the Recyclers on the way to them, count.
const recyclingGainsOfFixtures = memoizedByLayout((allFixtures): RecyclingGains => {
  const balance = interiorLayoutOf('recyclingPlant')?.recycling;
  if (!balance) return NO_RECYCLING;
  const { fixtures, links, line } = interiorReportOf(allFixtures);
  const byId = new Map(fixtures.map(fixture => [fixture.id, fixture]));
  const onLine = (id: number) => links.lined.has(id) && byId.has(id);
  const key = (id: number, stage: number) => id * 3 + stage;
  const edges = new Map<number, number[]>();
  const queue: [number, number][] = fixtures.filter(fixture => FIXTURES[fixture.type].family === 'intake' && onLine(fixture.id)).map(fixture => [fixture.id, 0]);
  const seen = new Set(queue.map(([id, stage]) => key(id, stage)));
  while (queue.length > 0) {
    const [id, stage] = queue.shift()!;
    for (const target of line.next.get(id) ?? []) {
      if (!onLine(target)) continue;
      const targetStage = recyclingStageOf(byId.get(target)!, stage);
      edges.set(key(id, stage), [...(edges.get(key(id, stage)) ?? []), key(target, targetStage)]);
      if (seen.has(key(target, targetStage))) continue;
      seen.add(key(target, targetStage));
      queue.push([target, targetStage]);
    }
  }
  const good = new Set([...seen].filter(state => roleOf(byId.get(Math.floor(state / 3))!) === 'exit' && state % 3 === 2));
  for (let grew = true; grew; ) {
    grew = false;
    for (const [state, targets] of edges) {
      if (good.has(state) || !targets.some(target => good.has(target))) continue;
      good.add(state);
      grew = true;
    }
  }
  const complete = [...good].map(state => byId.get(Math.floor(state / 3))!);
  const exits = new Set(complete.filter(fixture => roleOf(fixture) === 'exit').map(fixture => fixture.id));
  const recyclers = new Map(complete.filter(fixture => (RECYCLER_FAMILIES as readonly (string | undefined)[]).includes(FIXTURES[fixture.type].family)).map(fixture => [fixture.id, FIXTURES[fixture.type].family!]));
  const kinds = new Set(recyclers.values()).size;
  return {
    capacity: exits.size * balance.exitCapacity + (kinds === RECYCLER_FAMILIES.length ? balance.allKindsCapacity : 0),
    collectionDistance: recyclers.size * balance.recyclerDistance,
    exits: exits.size,
    recyclers: recyclers.size,
    kinds,
  };
});

// What the complete Recycling lines of a Recycling plant add to its capacity and its Collection distance.
export const recyclingGainsOf = (building: Pick<Building, 'interior'>): RecyclingGains => (building.interior ? recyclingGainsOfFixtures(building.interior.fixtures) : NO_RECYCLING);

// The most Exits, Sorters and Recyclers a Recycling interior can have at a Tier.
export const recyclingLimitsOf = (tier: number): { exits: number; sorters: number; recyclers: number } => {
  const balance = interiorLayoutOf('recyclingPlant')!.recycling!;
  return { exits: valueByTier(balance.exitLimits, tier), sorters: valueByTier(balance.sorterLimits, tier), recyclers: valueByTier(balance.recyclerLimits, tier) };
};

