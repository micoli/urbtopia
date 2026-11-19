import { describe, expect, it } from 'vitest';
import { cellKey, cellsOfBoard, distanceBetween, neighbourOf, neighboursOf, oppositeEdge } from './hexGrid';

const ORIGIN = { q: 0, r: 0 };

describe('the hexagonal grid', () => {
  it('gives six distinct neighbours, each at distance 1', () => {
    const neighbours = neighboursOf(ORIGIN);
    expect(neighbours).toHaveLength(6);
    expect(new Set(neighbours.map(cellKey)).size).toBe(6);
    expect(neighbours.every(cell => distanceBetween(ORIGIN, cell) === 1)).toBe(true);
  });

  it.each([0, 1, 2, 3, 4, 5])('finds the origin again from the neighbour across edge %i, by the opposite edge', edge => {
    const across = neighbourOf(ORIGIN, edge);
    expect(neighbourOf(across, oppositeEdge(edge))).toEqual(ORIGIN);
  });

  it.each([
    { a: { q: 0, r: 0 }, b: { q: 0, r: 0 }, expected: 0 },
    { a: { q: 0, r: 0 }, b: { q: 2, r: -1 }, expected: 2 },
    { a: { q: 0, r: 0 }, b: { q: 3, r: 1 }, expected: 4 },
    { a: { q: -2, r: 3 }, b: { q: 1, r: -1 }, expected: 4 },
  ])('measures $expected between ($a.q,$a.r) and ($b.q,$b.r)', ({ a, b, expected }) => {
    expect(distanceBetween(a, b)).toBe(expected);
    expect(distanceBetween(b, a)).toBe(expected);
  });

  it.each([
    { radius: 0, cells: 1 },
    { radius: 1, cells: 7 },
    { radius: 3, cells: 37 },
    { radius: 4, cells: 61 },
  ])('has $cells cells on a board of radius $radius, all within it', ({ radius, cells }) => {
    const board = cellsOfBoard(radius);
    expect(board).toHaveLength(cells);
    expect(new Set(board.map(cellKey)).size).toBe(cells);
    expect(board.every(cell => distanceBetween(ORIGIN, cell) <= radius)).toBe(true);
  });
});
