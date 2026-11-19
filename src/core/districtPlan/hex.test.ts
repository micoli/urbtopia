import { describe, expect, it } from 'vitest';
import { isHexValid, rotateHex, type Hex } from './hex';

const hexOf = (...edges: Hex['edges']): Hex => ({ edges });

const SPLIT = hexOf('habitat', 'habitat', 'habitat', 'park', 'park', 'park');

describe('a Hex', () => {
  it.each([
    { turns: 0, expected: ['habitat', 'habitat', 'habitat', 'park', 'park', 'park'] },
    { turns: 1, expected: ['park', 'habitat', 'habitat', 'habitat', 'park', 'park'] },
    { turns: 3, expected: ['park', 'park', 'park', 'habitat', 'habitat', 'habitat'] },
    { turns: 6, expected: ['habitat', 'habitat', 'habitat', 'park', 'park', 'park'] },
    { turns: -1, expected: ['habitat', 'habitat', 'park', 'park', 'park', 'habitat'] },
    { turns: 7, expected: ['park', 'habitat', 'habitat', 'habitat', 'park', 'park'] },
  ])('turns by $turns step(s) of 60°', ({ turns, expected }) => {
    expect(rotateHex(SPLIT, turns).edges).toEqual(expected);
  });

  it('keeps the same edges in the same order after six turns, whatever they are', () => {
    const mixed = hexOf('habitat', 'park', 'commerce', 'industry', 'service', 'water');
    expect(rotateHex(mixed, 6)).toEqual(mixed);
  });

  it('does not change the Hex it turns', () => {
    rotateHex(SPLIT, 2);
    expect(SPLIT.edges).toEqual(['habitat', 'habitat', 'habitat', 'park', 'park', 'park']);
  });

  it.each([
    { name: 'six edges of one category', edges: ['park', 'park', 'park', 'park', 'park', 'park'], valid: true },
    { name: 'two categories', edges: ['habitat', 'park', 'park', 'habitat', 'habitat', 'park'], valid: true },
    { name: 'three categories', edges: ['habitat', 'park', 'water', 'habitat', 'habitat', 'park'], valid: false },
    { name: 'five edges', edges: ['habitat', 'park', 'park', 'habitat', 'habitat'], valid: false },
    { name: 'seven edges', edges: ['park', 'park', 'park', 'park', 'park', 'park', 'park'], valid: false },
  ])('is valid with at most two categories on exactly six edges: $name', ({ edges, valid }) => {
    expect(isHexValid({ edges: edges as Hex['edges'] })).toBe(valid);
  });
});
