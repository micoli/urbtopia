import { describe, expect, it } from 'vitest';
import { assignJobs, type JobCandidate, type JobMode } from './jobAssignment';

const candidate = (home: number, workplace: number, mode: JobMode, minutes: number, lines: number[] = []): JobCandidate => ({
  home, workplace, mode, minutes, ...(mode === 'transit' ? { option: { lines, minutes, bike: false, legs: [], targets: [workplace] } } : {}),
});
const countsOf = (candidates: JobCandidate[], citizens: [number, number][], jobs: [number, number][], spare: [number, number][] = []) => {
  const { assignments, unemployed } = assignJobs(new Map(citizens), new Map(jobs), new Map(spare), candidates);
  return { assignments: assignments.map(({ candidate: c, count }) => `${c.home}>${c.workplace} ${c.mode} ${count}`), unemployed };
};

describe('assignJobs', () => {
  it('serves Walkers before Cyclists before the others, whatever their travel time', () => {
    const { assignments } = countsOf(
      [candidate(1, 10, 'transit', 1, [7]), candidate(2, 10, 'cycle', 5), candidate(3, 10, 'walk', 9)],
      [[1, 5], [2, 5], [3, 5]], [[10, 5]], [[7, 100]],
    );
    expect(assignments).toEqual(['3>10 walk 5']);
  });

  it('gives a Home the nearest Job first, then the next one when it runs out', () => {
    const { assignments, unemployed } = countsOf(
      [candidate(1, 10, 'car', 2), candidate(1, 11, 'car', 6)],
      [[1, 10]], [[10, 4], [11, 4]],
    );
    expect(assignments).toEqual(['1>10 car 4', '1>11 car 4']);
    expect(unemployed.get(1)).toBe(2);
  });

  it('prefers public transport at equal travel time and the faster mode otherwise', () => {
    expect(countsOf([candidate(1, 10, 'car', 4), candidate(1, 10, 'transit', 4, [7])], [[1, 3]], [[10, 9]], [[7, 9]]).assignments).toEqual(['1>10 transit 3']);
    expect(countsOf([candidate(1, 10, 'car', 3), candidate(1, 10, 'transit', 4, [7])], [[1, 3]], [[10, 9]], [[7, 9]]).assignments).toEqual(['1>10 car 3']);
  });

  it('falls back to the car when the line has no seat left', () => {
    const { assignments } = countsOf(
      [candidate(1, 10, 'transit', 2, [7]), candidate(1, 10, 'car', 6)],
      [[1, 10]], [[10, 10]], [[7, 4]],
    );
    expect(assignments).toEqual(['1>10 transit 4', '1>10 car 6']);
  });

  it('takes two places per line for a Rider who brings a bicycle', () => {
    const bike: JobCandidate = { home: 1, workplace: 10, mode: 'transit', minutes: 2, option: { lines: [7], minutes: 2, bike: true, legs: [], targets: [10] } };
    expect(countsOf([bike], [[1, 10]], [[10, 10]], [[7, 6]]).assignments).toEqual(['1>10 transit 3']);
  });

  it('does not depend on the order of the Homes', () => {
    const list = [candidate(1, 10, 'car', 3), candidate(2, 10, 'car', 3), candidate(3, 10, 'car', 3)];
    const citizens: [number, number][] = [[1, 5], [2, 5], [3, 5]];
    expect(countsOf(list, citizens, [[10, 7]]).assignments).toEqual(countsOf([...list].reverse(), [...citizens].reverse(), [[10, 7]]).assignments);
  });

  it('leaves every Citizen unemployed when no Job is within reach', () => {
    expect(countsOf([], [[1, 8]], [[10, 8]]).unemployed.get(1)).toBe(8);
  });
});
