import { describe, expect, it } from 'vitest';
import { DISTRICT_PLAN } from './districtPlanBalance';
import type { Hex } from './hex';
import { isPlacementValid } from './districtPlacement';
import type { PlacedHex } from './districtScore';

const hex: Hex = { edges: ['habitat', 'habitat', 'habitat', 'park', 'park', 'park'] };

const board = (...cells: [number, number][]): PlacedHex[] => cells.map(([q, r]) => ({ cell: { q, r }, hex }));

describe('where a Hex can be placed', () => {
  it('accepts a free cell that touches a placed Hex', () => {
    expect(isPlacementValid(board([0, 0]), { q: 1, r: 0 })).toBe(true);
  });

  it('refuses a cell that is already taken', () => {
    expect(isPlacementValid(board([0, 0], [1, 0]), { q: 1, r: 0 })).toBe(false);
  });

  it('refuses a free cell that touches nothing', () => {
    expect(isPlacementValid(board([0, 0]), { q: 2, r: 0 })).toBe(false);
  });

  it('refuses everything on an empty board: the Start hex is placed by the Deck', () => {
    expect(isPlacementValid([], { q: 0, r: 0 })).toBe(false);
  });

  it('accepts a cell on the last ring of the board', () => {
    const radius = DISTRICT_PLAN.boardRadius;
    const inside = Array.from({ length: radius }, (_, q): [number, number] => [q, 0]);
    expect(isPlacementValid(board(...inside), { q: radius, r: 0 })).toBe(true);
  });

  it('refuses a cell beyond the radius even when it touches a placed Hex', () => {
    const radius = DISTRICT_PLAN.boardRadius;
    const inside = Array.from({ length: radius + 1 }, (_, q): [number, number] => [q, 0]);
    expect(isPlacementValid(board(...inside), { q: radius + 1, r: 0 })).toBe(false);
  });
});
