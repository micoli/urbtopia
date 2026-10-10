import { describe, expect, it } from 'vitest';
import type { VenueFixture } from '../core';
import { CROWD, planCrowd, type CrowdInput } from './venueCrowd';

const fixture = (id: number, type: VenueFixture['type'], x: number, y: number, rotation: VenueFixture['rotation'] = 0): VenueFixture => ({ id, type, x, y, rotation });
const input = (extra: Partial<CrowdInput> = {}): CrowdInput => {
  const fixtures = [fixture(1, 'counter', 3, 1), fixture(2, 'barrelClimber', 1, 2), fixture(3, 'spaceShooter', 2, 4), fixture(4, 'billiard', 4, 4)];
  return { size: 6, entrance: { x: 3, y: 0 }, fixtures, usageByFixture: new Map([[2, 4], [3, 5], [4, 2]]), saturation: 1, demandRatio: 1, employees: 2, ...extra };
};
const cells = (figures: ReturnType<typeof planCrowd>) => figures.map(figure => `${figure.x}:${figure.y}`);

describe('Venue crowd', () => {
  it('puts a gamer in front of each busy game when the Venue is saturated', () => {
    const figures = planCrowd(input());
    expect(figures.filter(figure => figure.kind === 'gamer')).toHaveLength(3);
  });

  it('shows fewer gamers when the Venue is quiet, but one as soon as someone plays', () => {
    expect(planCrowd(input({ saturation: 0.34 })).filter(figure => figure.kind === 'gamer')).toHaveLength(1);
    expect(planCrowd(input({ saturation: 0.01 })).filter(figure => figure.kind === 'gamer')).toHaveLength(1);
    expect(planCrowd(input({ saturation: 0, usageByFixture: new Map() })).filter(figure => figure.kind === 'gamer')).toHaveLength(0);
  });

  it('never stacks two figures on a cell, a Fixture or the entrance', () => {
    const figures = planCrowd(input({ demandRatio: 3, employees: 3 }));
    const used = cells(figures);
    expect(new Set(used).size).toBe(used.length);
    const blocked = new Set(['3:0', '3:1', '1:2', '2:4', '4:4', '5:4']);
    expect(used.some(cell => blocked.has(cell))).toBe(false);
    expect(figures.every(figure => figure.x >= 0 && figure.y >= 0 && figure.x < 6 && figure.y < 6)).toBe(true);
  });

  it('grows a queue at the counter when more Visitors come than can be served, and none otherwise', () => {
    expect(planCrowd(input({ demandRatio: 1 })).filter(figure => figure.kind === 'queue')).toHaveLength(0);
    const small = planCrowd(input({ demandRatio: 1.2 })).filter(figure => figure.kind === 'queue').length;
    const large = planCrowd(input({ demandRatio: 2 })).filter(figure => figure.kind === 'queue').length;
    expect(small).toBeGreaterThan(0);
    expect(large).toBeGreaterThan(small);
    expect(large).toBeLessThanOrEqual(CROWD.maxQueue);
  });

  it('queues near the counter', () => {
    const queue = planCrowd(input({ demandRatio: 2, employees: 0 })).filter(figure => figure.kind === 'queue');
    expect(queue.every(figure => Math.abs(figure.x - 3) + Math.abs(figure.y - 1) <= 4)).toBe(true);
  });

  it('shows one employee per hired employee, up to three', () => {
    expect(planCrowd(input({ employees: 2 })).filter(figure => figure.kind === 'employee')).toHaveLength(2);
    expect(planCrowd(input({ employees: 9 })).filter(figure => figure.kind === 'employee')).toHaveLength(3);
  });

  it('is deterministic, and bounded', () => {
    expect(planCrowd(input({ demandRatio: 2 }))).toEqual(planCrowd(input({ demandRatio: 2 })));
    const crowded = input({ size: 10, demandRatio: 5, employees: 3 });
    expect(planCrowd(crowded).length).toBeLessThanOrEqual(CROWD.maxFigures);
  });

  it('works in an empty Venue', () => {
    expect(planCrowd({ size: 6, entrance: { x: 3, y: 0 }, fixtures: [], usageByFixture: new Map(), saturation: 0, demandRatio: 0, employees: 0 })).toEqual([]);
  });
});
