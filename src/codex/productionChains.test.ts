import { describe, expect, it } from 'vitest';
import { MATERIALS } from '../core';
import { PRODUCTION_CHAINS, flattenChain, isDeadEnd, type ChainItem } from './productionChains';

const all = PRODUCTION_CHAINS.flatMap(flattenChain);
const find = (item: string): ChainItem => all.find((entry) => entry.item === item)!;
const rootOf = (building: string) => PRODUCTION_CHAINS.find((root) => root.building === building)!;

describe('production chains', () => {
  it('starts from the Workshop, the Marina, the Farm and the three orchard trees', () => {
    expect(PRODUCTION_CHAINS.map((root) => root.building)).toEqual(['workshop', 'marina', 'farm', 'oliveTree', 'appleTree', 'cherryTree']);
  });

  it('follows olive to the Mill, then olive oil to the Bakery and the Packhouse', () => {
    const [oliveStep] = rootOf('oliveTree').items[0]!.steps;
    expect(oliveStep!.building).toBe('mill');
    const oil = oliveStep!.outputs[0]!;
    expect(oil.item).toBe('oliveOil');
    expect(oil.steps.map((step) => step.building)).toEqual(['bakery', 'packhouse']);
  });

  it('folds the pack formats of a Crop into one row', () => {
    const crate = find('cherryCrate');
    expect(crate.alsoAs).toEqual(['cherryBox', 'cherryPallet']);
    expect(all.some((entry) => entry.item === 'cherryBox' && !crate.alsoAs.includes('cherryBox' as never))).toBe(false);
  });

  it('lists where a Good is sold: shops, the Bakery counter, the Market and the Supermarket', () => {
    const kinds = (item: string) => find(item).soldAt.map((channel) => ('building' in channel ? `${channel.kind}:${channel.building}` : channel.kind));
    expect(kinds('bread')).toEqual(['counter:bakery', 'market', 'supermarket']);
    expect(kinds('oliveOilCrate')).toEqual(expect.arrayContaining(['shop:shopFood', 'shop:shop', 'market', 'supermarket']));
    expect(find('planks').soldAt).toContainEqual({ kind: 'shop', building: 'shopConstruction', fromTier: 1 });
  });

  it('sells a Material through no channel and reaches a Good through every Material', () => {
    expect(find('wood').soldAt).toEqual([]);
    const materialsWithoutDestination = all.filter((entry) => entry.item in MATERIALS && isDeadEnd(entry)).map((entry) => entry.item);
    expect(materialsWithoutDestination).toEqual([]);
  });
});
