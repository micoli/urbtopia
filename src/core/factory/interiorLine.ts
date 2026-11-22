import { FIXTURES } from '../venues/fixtures';
import { type FixtureSide } from '../venues/venueVocabulary';
import type { VenueFixture } from '../engine/state';
import { isProducerRole } from '../interiors/interiorStaff';
import { memoizedByLayout } from './memoizedByLayout';
import { SIDE_OFFSETS, interiorLinksOf, interiorReportOf, isFactoryFixture, isMachine, keyOf, placedOn, requiredStageOf, roleOf, sideToward, turned } from './interiorLinks';

// A way that Packets take on a Packhouse interior, as the points of the floor they go through, in cell units: from the mouth of a Packer, through the middle of each Fixture
// of its Line, to the hatch of an Exit. A Line that splits has a way for each Exit, which share their start, and Packets take them in turn.
export interface LinePath {
  source: number;
  points: readonly { x: number; y: number }[];
  // Bakery, Knitwear factory: the Good that the Packets have become once they have gone through an Oven or a Knitter, which is the point of the way where they turn into it, and the Good that arrives at the Exit: the Recipe of what they went through, not the Good the Exit sells.
  baked?: { from: number; good: string };
  // Engine room: lumps of coal ride the way, not crates.
  coal?: true;
}

const MOUTH = 0.15;
const HATCH = 0.8;

export const linePathsOf = memoizedByLayout((allFixtures): readonly LinePath[] => {
  const { fixtures, line } = interiorReportOf(allFixtures);
  const byId = new Map(fixtures.map(fixture => [fixture.id, fixture]));
  const centre = (fixture: VenueFixture) => ({ x: fixture.x + 0.5, y: fixture.y + 0.5 });
  const toward = (fixture: VenueFixture, side: FixtureSide, distance: number) => {
    const offset = turned(SIDE_OFFSETS[side], fixture.rotation);
    return { x: fixture.x + 0.5 + offset.x * distance, y: fixture.y + 0.5 + offset.y * distance };
  };
  const sources = fixtures.filter(fixture => line.lined.has(fixture.id) && (FIXTURES[fixture.type].lineOut?.length ?? 0) > 0 && FIXTURES[fixture.type].lineIn === undefined);
  const paths: LinePath[] = [];
  const walk = (source: VenueFixture, current: VenueFixture, points: readonly { x: number; y: number }[], seen: ReadonlySet<number>, baked?: { from: number; good: string }): void => {
    const nexts = (line.next.get(current.id) ?? []).filter(id => line.lined.has(id) && !seen.has(id));
    if (nexts.length === 0) {
      if (roleOf(current) !== 'exit') return;
      if (current.soldGood !== undefined && baked !== undefined && baked.good !== current.soldGood) return;
      const good = baked?.good ?? current.soldGood;
      paths.push({ source: source.id, points: [...points, toward(current, 'back', FIXTURES[current.type].hatch ?? HATCH)], ...(baked && good ? { baked: { from: baked.from, good } } : {}) });
      return;
    }
    const baking = (isProducerRole(FIXTURES[current.type].assigns) || FIXTURES[current.type].picks === true) && current.recipe !== undefined ? { from: points.length - 1, good: current.recipe } : baked;
    for (const id of nexts) {
      const next = byId.get(id);
      if (next) walk(source, next, [...points, centre(next)], new Set([...seen, id]), baking);
    }
  };
  for (const source of sources) walk(source, source, [toward(source, 'front', MOUTH)], new Set([source.id]));
  return paths;
});

// Why a Fixture of a Line carries no Packets: following what should feed it backwards, where the chain stops.
export type LineFault =
  // The Fixture that feeds the chain is broken: repair it.
  | { kind: 'broken'; fixture: VenueFixture }
  // A Packer or a Strapper along the way gets no Drive.
  | { kind: 'noDrive'; fixture: VenueFixture }
  // A Machine along the way that runs on Flow, such as a milk vat, gets none.
  | { kind: 'noFlow'; fixture: VenueFixture }
  // The Fixture next to the entry does not carry toward it: turn it, or replace it.
  | { kind: 'misfacing'; fixture: VenueFixture }
  // The Machine that feeds it already feeds as many as its limit allows.
  | { kind: 'overfed'; fixture: VenueFixture }
  // The Fixture next to the entry sends no Packets at all, such as a Motor: a Conveyor must bring them from the Line.
  | { kind: 'noOutput'; fixture: VenueFixture }
  // The Line reaches the Fixture without passing through the Fixture it requires, such as the Finisher of a Knitwear factory.
  | { kind: 'missingStage'; fixture: VenueFixture }
  // Nothing at all lies next to the entry.
  | { kind: 'deadEnd'; cell: { x: number; y: number }; of: VenueFixture };

export function lineFaultOf(allFixtures: readonly VenueFixture[], start: VenueFixture): LineFault | undefined {
  const { links } = interiorReportOf(allFixtures);
  if (links.lined.has(start.id)) return undefined;
  if (links.overfed.has(start.id)) return { kind: 'overfed', fixture: start };
  const sides = (fixture: VenueFixture, key: 'lineIn' | 'lineOut'): readonly FixtureSide[] => FIXTURES[fixture.type][key] ?? [];
  const at = placedOn(allFixtures.filter(isFactoryFixture));
  const cellAt = (fixture: VenueFixture, side: FixtureSide) => {
    const offset = turned(SIDE_OFFSETS[side], fixture.rotation);
    return { x: fixture.x + offset.x, y: fixture.y + offset.y };
  };
  const seen = new Set<number>();
  let current = start;
  for (;;) {
    seen.add(current.id);
    if (isMachine(current) && !links.linked.has(current.id) && current.broken !== true) {
      const lacksFlowOnly = links.problems.get(current.id)?.every(problem => problem === 'noFlow' || problem === 'tankFull');
      return { kind: lacksFlowOnly ? 'noFlow' : 'noDrive', fixture: current };
    }
    const entries = sides(current, 'lineIn');
    if (entries.length === 0) return requiredStageOf(allFixtures) !== undefined && !allFixtures.some(fixture => seen.has(fixture.id) && FIXTURES[fixture.type].family === requiredStageOf(allFixtures)) ? { kind: 'missingStage', fixture: start } : undefined;
    const feeders = entries.flatMap(side => {
      const cell = cellAt(current, side);
      const neighbour = at.get(keyOf(cell.x, cell.y));
      const facing = neighbour && sideToward(neighbour, current);
      return neighbour && facing && sides(neighbour, 'lineOut').includes(facing) ? [neighbour] : [];
    });
    const feeder = feeders.find(candidate => !seen.has(candidate.id));
    if (!feeder) {
      const first = entries.map(side => cellAt(current, side)).find(cell => !at.has(keyOf(cell.x, cell.y))) ?? cellAt(current, entries[0]!);
      const wrong = entries.map(side => at.get(keyOf(cellAt(current, side).x, cellAt(current, side).y))).find(neighbour => neighbour !== undefined);
      if (wrong && sides(wrong, 'lineOut').length === 0) return { kind: 'noOutput', fixture: wrong };
      return wrong ? { kind: 'misfacing', fixture: wrong } : { kind: 'deadEnd', cell: first, of: current };
    }
    if (feeder.broken === true) return { kind: 'broken', fixture: feeder };
    current = feeder;
  }
}

// The Exits of a Packhouse interior that Packets reach.
export const linkedExitsOf = memoizedByLayout((allFixtures): readonly VenueFixture[] => {
  const { lined } = interiorLinksOf(allFixtures);
  return allFixtures.filter(fixture => lined.has(fixture.id) && roleOf(fixture) === 'exit');
});

// The Machines of a Factory interior that run: driven, fed and not broken.
export const runningMachinesOf = memoizedByLayout((allFixtures): readonly VenueFixture[] => {
  const { linked } = interiorLinksOf(allFixtures);
  return allFixtures.filter(fixture => linked.has(fixture.id) && roleOf(fixture) === 'machine');
});

// The Fixtures from which Packets can reach a Fixture through the Line. The report is cached by layout, so they are read from the interior itself.
const feedersOf = memoizedByLayout((allFixtures): ReadonlyMap<number, readonly number[]> => {
  const feeders = new Map<number, number[]>();
  for (const [from, targets] of interiorReportOf(allFixtures).line.next) for (const target of targets) feeders.set(target, [...(feeders.get(target) ?? []), from]);
  return feeders;
});

export function interiorUpstreamOf(allFixtures: readonly VenueFixture[], id: number): VenueFixture[] {
  const feeders = feedersOf(allFixtures);
  const seen = new Set<number>();
  const queue = [id];
  while (queue.length > 0) for (const feeder of feeders.get(queue.shift()!) ?? []) if (!seen.has(feeder)) {
    seen.add(feeder);
    queue.push(feeder);
  }
  return allFixtures.filter(fixture => seen.has(fixture.id));
}

// The Goods a Display counter can sell: the Recipes of the Ovens upstream of it, worked out once for each state of the floor.
const supplied = new WeakMap<readonly VenueFixture[], Map<number, ReadonlySet<string>>>();

export function suppliedGoodsOf(allFixtures: readonly VenueFixture[], counter: VenueFixture): ReadonlySet<string> {
  const perCounter = supplied.get(allFixtures) ?? new Map<number, ReadonlySet<string>>();
  supplied.set(allFixtures, perCounter);
  const known = perCounter.get(counter.id);
  if (known) return known;
  const goods = new Set(interiorUpstreamOf(allFixtures, counter.id).filter(fixture => isProducerRole(FIXTURES[fixture.type].assigns) && fixture.recipe !== undefined).map(fixture => fixture.recipe!));
  perCounter.set(counter.id, goods);
  return goods;
}

