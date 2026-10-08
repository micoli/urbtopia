import { FIXTURES } from './fixtures';
import { nextRandom } from '../engine/random';
import type { VenueFixture } from '../engine/state';

export const WEAR = {
  perPlay: 0.5,
  breakdownBelow: 40,
  maxBreakdownChance: 0.5,
  repairRatio: 0.6,
  technicianRepairRatio: 0.6,
  technicianWear: 0.6,
};

export const conditionOf = (fixture: VenueFixture): number => fixture.condition ?? 100;

export const isBroken = (fixture: VenueFixture): boolean => fixture.broken === true;

export const isWorn = (fixture: VenueFixture): boolean => conditionOf(fixture) < 100;

export const repairCost = (fixture: VenueFixture): number => Math.ceil(FIXTURES[fixture.type].price * WEAR.repairRatio * (100 - conditionOf(fixture)) / 100);

export const technicianRepairCost = (fixture: VenueFixture): number => Math.ceil(repairCost(fixture) * WEAR.technicianRepairRatio);

export const technicianWearFactor = (technicians: number): number => (technicians > 0 ? WEAR.technicianWear : 1);

export function wearFixtures(fixtures: readonly VenueFixture[], playsServed: ReadonlyMap<number, number>, hours: number, technicians: number): VenueFixture[] {
  const factor = technicianWearFactor(technicians);
  return fixtures.map(fixture => {
    const plays = playsServed.get(fixture.id) ?? 0;
    if (plays === 0 || isBroken(fixture)) return fixture;
    return { ...fixture, condition: Math.max(0, conditionOf(fixture) - WEAR.perPlay * (FIXTURES[fixture.type].wear ?? 1) * plays * hours * factor) };
  });
}

export function breakdownChance(fixture: VenueFixture): number {
  const condition = conditionOf(fixture);
  if (isBroken(fixture) || condition >= WEAR.breakdownBelow) return 0;
  return WEAR.maxBreakdownChance * (WEAR.breakdownBelow - condition) / WEAR.breakdownBelow;
}

export function drawBreakdowns(fixtures: readonly VenueFixture[], rng: number): { fixtures: VenueFixture[]; rng: number } {
  let state = rng;
  const updated = fixtures.map(fixture => {
    const chance = breakdownChance(fixture);
    if (chance === 0) return fixture;
    const draw = nextRandom(state);
    state = draw.rngState;
    return draw.value < chance ? { ...fixture, broken: true as const } : fixture;
  });
  return { fixtures: updated, rng: state };
}

export function technicianRepairs(fixtures: readonly VenueFixture[], technicians: number, funds: number): { fixtures: VenueFixture[]; spent: number } {
  const queue = fixtures.filter(isWorn).sort((a, b) => Number(isBroken(b)) - Number(isBroken(a)) || conditionOf(a) - conditionOf(b) || a.id - b.id).slice(0, technicians);
  let spent = 0;
  const repaired = new Set<number>();
  for (const fixture of queue) {
    const cost = technicianRepairCost(fixture);
    if (spent + cost > funds) continue;
    spent += cost;
    repaired.add(fixture.id);
  }
  return { fixtures: fixtures.map(fixture => (repaired.has(fixture.id) ? restored(fixture) : fixture)), spent };
}

export function restored(fixture: VenueFixture): VenueFixture {
  const next: VenueFixture = { ...fixture, condition: 100 };
  delete next.broken;
  return next;
}
