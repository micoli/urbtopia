import { describe, expect, it } from 'vitest';
import { moveItem } from './moveItem';

describe('moveItem', () => {
  it('swaps with the neighbour in the given direction', () => {
    expect(moveItem([1, 2, 3], 1, -1)).toEqual([2, 1, 3]);
    expect(moveItem([1, 2, 3], 1, 1)).toEqual([1, 3, 2]);
  });
  it('keeps the order at the boundaries', () => {
    expect(moveItem([1, 2, 3], 0, -1)).toEqual([1, 2, 3]);
    expect(moveItem([1, 2, 3], 2, 1)).toEqual([1, 2, 3]);
  });
  it('does not mutate its input', () => {
    const items = [1, 2];
    moveItem(items, 0, 1);
    expect(items).toEqual([1, 2]);
  });
});
