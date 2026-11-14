import { describe, expect, it } from 'vitest';
import { createBuilding, type Building, type QueueEntry } from '../index';
import { advanceBuilding, isLaneIdle } from './production';

const entry = (item: QueueEntry['item'], startedAt: number | null, duration: number, exitId?: number): QueueEntry => ({ item, duration, startedAt, done: false, quantity: 1, ...(exitId === undefined ? {} : { exitId }) });
const withQueue = (type: 'bakery' | 'workshop', queue: QueueEntry[]): Building => ({ ...createBuilding(1, type, 0, 0, 0), queue });

describe('the lines of a Bakery', () => {
  it('bakes on one line for each Oven, so that an entry only waits for those of its own line', () => {
    const bakery = withQueue('bakery', [entry('bread', 0, 100, 1), entry('appleCake', 0, 150, 2), entry('bread', null, 100, 1), entry('cherryClafoutis', null, 100)]);
    const { building } = advanceBuilding(bakery, 120);
    expect(building.queue.map(candidate => candidate.done)).toEqual([true, false, false, false]);
    expect(building.queue[2]!.startedAt).toBe(100);
    expect(building.queue[3]!.startedAt).toBeNull();
  });

  it('keeps the entries of one line in order', () => {
    const bakery = withQueue('bakery', [entry('bread', 0, 100, 1), entry('bread', null, 100, 1)]);
    expect(advanceBuilding(bakery, 50).building.queue[1]!.startedAt).toBeNull();
    expect(advanceBuilding(bakery, 250).building.queue.every(candidate => candidate.done)).toBe(true);
  });

  it('tells whether a line has nothing left to do, whatever the other lines do', () => {
    const bakery = withQueue('bakery', [entry('bread', 0, 100, 1)]);
    expect(isLaneIdle(bakery, 1)).toBe(false);
    expect(isLaneIdle(bakery, 2)).toBe(true);
    expect(isLaneIdle(bakery)).toBe(true);
  });

  it('leaves every other building with a single line', () => {
    const workshop = withQueue('workshop', [entry('planks', 0, 100, 1), entry('planks', null, 100, 2)]);
    expect(advanceBuilding(workshop, 50).building.queue[1]!.startedAt).toBeNull();
    expect(isLaneIdle(workshop, 2)).toBe(false);
  });
});
