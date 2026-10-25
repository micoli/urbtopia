import { describe, expect, it } from 'vitest';
import { filterChains, type ChainFilter } from './filterChains';
import { PRODUCTION_CHAINS, flattenChain } from './productionChains';

const none: ChainFilter = { searching: false, matchesItem: () => false, matchesBuilding: () => false, keepItem: () => true };
const itemsOf = (roots: typeof PRODUCTION_CHAINS) => roots.flatMap(flattenChain).map((entry) => entry.item);

describe('filterChains', () => {
  it('keeps everything without a query', () => {
    expect(filterChains(PRODUCTION_CHAINS, none)).toEqual(PRODUCTION_CHAINS);
  });

  it('keeps a matching Good with its way back to the producer and nothing else', () => {
    const roots = filterChains(PRODUCTION_CHAINS, { ...none, searching: true, matchesItem: (item) => item === 'bread' });
    expect(roots.map((root) => root.building)).toEqual(['farm']);
    expect(itemsOf(roots)).toEqual(['wheat', 'flour', 'bread']);
  });

  it('keeps all of a matching building, below it', () => {
    const roots = filterChains(PRODUCTION_CHAINS, { ...none, searching: true, matchesBuilding: (building) => building === 'bakery' });
    expect(itemsOf(roots)).toContain('fougasse');
    expect(itemsOf(roots)).not.toContain('planks');
  });

  it('drops locked items with what they lead to', () => {
    const roots = filterChains(PRODUCTION_CHAINS, { ...none, keepItem: (item) => item !== 'flour' });
    expect(itemsOf(roots)).not.toContain('bread');
    expect(itemsOf(roots)).toContain('wheat');
  });

  it('returns no root for a query nothing matches', () => {
    expect(filterChains(PRODUCTION_CHAINS, { ...none, searching: true })).toEqual([]);
  });
});
