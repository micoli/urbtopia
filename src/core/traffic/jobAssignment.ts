import type { TransitOption } from '../transit/transport';

export type JobMode = 'walk' | 'cycle' | 'car' | 'transit';

// One way for the Citizens of a Home to reach one workplace.
export interface JobCandidate<Detail = unknown> {
  home: number;
  workplace: number;
  mode: JobMode;
  minutes: number;
  option?: TransitOption;
  detail?: Detail;
}

export interface JobAssignment<Detail = unknown> {
  candidate: JobCandidate<Detail>;
  count: number;
}

// Walkers are served first, then Cyclists, then everyone else by travel time; a tie goes to public transport, which loads no road.
const PASSES: readonly (readonly JobMode[])[] = [['walk'], ['cycle'], ['transit', 'car']];
const MODE_RANK: Record<JobMode, number> = { walk: 0, cycle: 0, transit: 0, car: 1 };
const EPSILON = 1e-9;

const rounded = (minutes: number): number => Math.round(minutes * 1e6) / 1e6;

function byTravelTime(a: JobCandidate, b: JobCandidate): number {
  return rounded(a.minutes) - rounded(b.minutes) || MODE_RANK[a.mode] - MODE_RANK[b.mode] || a.home - b.home || a.workplace - b.workplace;
}

// Gives every Citizen the Job they reach fastest within their group, across the whole city, so the result never depends on the order the Homes are visited in.
export function assignJobs<Detail>(
  citizens: ReadonlyMap<number, number>,
  jobs: ReadonlyMap<number, number>,
  spareCapacity: ReadonlyMap<number, number>,
  candidates: readonly JobCandidate<Detail>[],
): { assignments: JobAssignment<Detail>[]; unemployed: Map<number, number> } {
  const waiting = new Map(citizens);
  const jobsLeft = new Map(jobs);
  const spare = new Map(spareCapacity);
  const assignments: JobAssignment<Detail>[] = [];
  for (const pass of PASSES) {
    const ordered = candidates.filter(candidate => pass.includes(candidate.mode)).sort(byTravelTime);
    for (const candidate of ordered) {
      const count = Math.min(waiting.get(candidate.home) ?? 0, jobsLeft.get(candidate.workplace) ?? 0, seatsOn(candidate, spare));
      if (count <= EPSILON) continue;
      waiting.set(candidate.home, waiting.get(candidate.home)! - count);
      jobsLeft.set(candidate.workplace, jobsLeft.get(candidate.workplace)! - count);
      takeSeats(candidate, count, spare);
      assignments.push({ candidate, count });
    }
  }
  return { assignments, unemployed: new Map([...waiting].map(([home, left]) => [home, left > EPSILON ? left : 0])) };
}

const placesOf = (option: TransitOption): number => (option.bike ? 2 : 1);

function seatsOn({ option }: JobCandidate, spare: ReadonlyMap<number, number>): number {
  if (!option) return Infinity;
  return Math.min(...option.lines.map(line => (spare.get(line) ?? 0) / placesOf(option)));
}

function takeSeats({ option }: JobCandidate, count: number, spare: Map<number, number>): void {
  if (!option) return;
  for (const line of option.lines) spare.set(line, (spare.get(line) ?? 0) - count * placesOf(option));
}
