import { describe, expect, it } from 'vitest';
import { patrolRoute } from './avatarPatrol';

describe('patrolRoute', () => {
  const box = { x: 3, y: 3, width: 1, depth: 1 };

  it('walks along the free tiles around a Fixture, on tile centres', () => {
    const route = patrolRoute(box, () => true);
    expect(route.length).toBeGreaterThan(1);
    expect(route.every(tile => Math.abs(tile.x - 3.5) <= 1 && Math.abs(tile.z - 3.5) <= 1 && (tile.x !== 3.5 || tile.z !== 3.5))).toBe(true);
  });

  it('stops at the tiles that another Fixture or the wall blocks', () => {
    const route = patrolRoute(box, (x, z) => x > 3 || z > 3);
    expect(route.every(tile => tile.x > 3 || tile.z > 3)).toBe(true);
  });

  it('has no route when the Fixture is walled in', () => {
    expect(patrolRoute(box, () => false)).toEqual([]);
  });
});
