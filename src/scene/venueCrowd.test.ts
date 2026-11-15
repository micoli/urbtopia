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

  it('sits a diner on the chair that faces a busy table, and leaves a table with no chair to a diner standing at it', () => {
    const fixtures = [fixture(1, 'restaurantTable', 2, 2), fixture(2, 'restaurantChair', 2, 1, 0), fixture(3, 'restaurantTable', 4, 4)];
    const figures = planCrowd({ size: 6, entrance: { x: 3, y: 0 }, fixtures, usageByFixture: new Map([[1, 3], [2, 3], [3, 3]]), saturation: 1, demandRatio: 1, employees: 0 });
    expect(figures.filter(figure => figure.kind === 'diner')).toEqual([{ kind: 'diner', x: 2, y: 1, facing: Math.atan2(0, 1) }]);
    expect(figures.filter(figure => figure.kind === 'gamer')).toHaveLength(1);
  });

  it('puts nobody in a room that no door opens on, and somebody in it once a doorway does', () => {
    const wallsOf = (type: VenueFixture['type']) => [fixture(10, 'arcadeWall', 0, 2, 0), fixture(11, 'arcadeWall', 1, 2, 0), fixture(12, type, 2, 2, 0), fixture(13, 'arcadeWall', 3, 2, 0), fixture(14, 'arcadeWall', 4, 2, 0), fixture(15, 'arcadeWall', 5, 2, 0)];
    const base = { size: 6, entrance: { x: 3, y: 0 }, saturation: 1, demandRatio: 1, employees: 0 };
    const closed = planCrowd({ ...base, fixtures: [...wallsOf('arcadeWall'), fixture(1, 'billiard', 1, 4)], usageByFixture: new Map([[1, 3]]) });
    expect(closed).toHaveLength(0);
    const open = planCrowd({ ...base, fixtures: [...wallsOf('arcadeDoorway'), fixture(1, 'billiard', 1, 4)], usageByFixture: new Map([[1, 3]]) });
    expect(open.filter(figure => figure.kind === 'gamer')).toHaveLength(1);
  });

  it('keeps the employees on the floor when the diners fill the crowd, even when the cells next to the entrance are walled in', () => {
    const chairs = Array.from({ length: 30 }, (_, index) => fixture(100 + index, 'restaurantChair', (index % 5) * 2, 4 + Math.floor(index / 5) * 2, 0));
    const table = fixture(1, 'restaurantTable', 15, 0);
    const wall = Array.from({ length: 6 }, (_, x) => fixture(200 + x, 'arcadeWall', x, 2, 0));
    const fixtures = [table, ...chairs, ...wall];
    const usageByFixture = new Map(fixtures.filter(item => item.id >= 100 && item.id < 200).map(item => [item.id, 1]));
    const figures = planCrowd({ size: 16, entrance: { x: 3, y: 0 }, fixtures, usageByFixture, saturation: 1, demandRatio: 1, employees: 3 });
    expect(figures).toHaveLength(CROWD.maxFigures);
    expect(figures.filter(figure => figure.kind === 'employee')).toHaveLength(3);
  });

  it('stands each role of the Restaurant staff at its post', () => {
    const fixtures = [fixture(1, 'cooktop', 6, 6), fixture(2, 'prepTable', 2, 6), fixture(3, 'restaurantBar', 2, 2), fixture(4, 'restaurantTable', 5, 3)];
    const staff = [{ role: 'cook' as const, count: 1 }, { role: 'kitchenAssistant' as const, count: 1 }, { role: 'bartender' as const, count: 1 }, { role: 'waiter' as const, count: 5 }, { role: 'maitreD' as const, count: 0 }];
    const figures = planCrowd({ size: 8, entrance: { x: 3, y: 0 }, fixtures, usageByFixture: new Map(), saturation: 0, demandRatio: 0, employees: 0, staff });
    const next = (figure: { x: number; y: number }, post: { x: number; y: number }) => Math.abs(figure.x - post.x) + Math.abs(figure.y - post.y) === 1;
    const of = (role: string) => figures.filter(figure => figure.role === role);
    expect(of('cook')).toHaveLength(1);
    expect(next(of('cook')[0]!, fixtures[0]!)).toBe(true);
    expect(next(of('kitchenAssistant')[0]!, fixtures[1]!)).toBe(true);
    expect(next(of('bartender')[0]!, fixtures[2]!)).toBe(true);
    expect(of('waiter')).toHaveLength(CROWD.maxPerRole);
    expect(of('maitreD')).toHaveLength(0);
  });
});
