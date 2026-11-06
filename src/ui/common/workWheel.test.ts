import { describe, expect, it } from 'vitest';
import type { QueueEntry, ShopStack } from '../../core';
import { sectorPath, wheelSegments } from './workWheel';

const entry = (duration: number, patch: Partial<QueueEntry> = {}): QueueEntry => ({ item: 'bricks', duration, startedAt: null, done: false, quantity: 1, ...patch });

const stack = (patch: Partial<ShopStack>): ShopStack => ({ good: 'planks', stock: 5, nextSaleAt: null, earned: 0, ...patch });

describe('work wheel', () => {
  it('gives each stocked stack of a counter its own sector, with its sold share as progress', () => {
    const stacks = [stack({ stock: 3, nextSaleAt: 500, earned: 28 }), stack({}), stack({ good: null, stock: 0 })];
    const segments = wheelSegments([], 0, stacks, 1000);
    expect(segments.map((segment) => segment.state)).toEqual(['running', 'waiting']);
    expect(segments[0]!.progress).toBeCloseTo((2 + 0.5) / 5);
    expect(segments[1]!.progress).toBe(0);
    expect(segments[0]!.endAngle).toBeCloseTo(180);
  });

  it('sizes each quarter by the duration of its production', () => {
    const [short, long] = wheelSegments([entry(1000), entry(3000)], 0);
    const shortSpan = short!.endAngle - short!.startAngle;
    const longSpan = long!.endAngle - long!.startAngle;
    expect(longSpan / shortSpan).toBeGreaterThan(2.7);
    expect(longSpan / shortSpan).toBeLessThan(3.1);
  });

  it('uses the whole wheel for a single production', () => {
    const [only] = wheelSegments([entry(1000, { startedAt: 0 })], 500);
    expect(only).toMatchObject({ startAngle: 0, endAngle: 360, state: 'running', progress: 0.5 });
  });

  it('tells done, running and waiting productions apart', () => {
    const states = wheelSegments([entry(1000, { done: true }), entry(1000, { startedAt: 0 }), entry(1000)], 250).map((segment) => segment.state);
    expect(states).toEqual(['done', 'running', 'waiting']);
  });

  it('draws nothing for an empty span', () => {
    expect(sectorPath(14, 10, 10)).toBe('');
  });
});
