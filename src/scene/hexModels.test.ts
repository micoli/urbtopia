import { describe, expect, it } from 'vitest';
import { DISTRICT_PLAN, HEX_CATEGORIES, type HexCategory } from '../core';
import { MODEL_ENTRIES } from '../core/models/modelFiles';
import { modelSlotsOf } from './hexModels';

const edges = (...list: HexCategory[]) => list;

describe('the models standing on a Hex', () => {
  it('has a registered model for every category', () => {
    for (const category of HEX_CATEGORIES) expect(MODEL_ENTRIES[DISTRICT_PLAN.categoryModels[category]], category).toBeDefined();
  });

  it('puts a single model in the heart of a Hex that has one category all around, drawn at its widest', () => {
    const [slot, ...others] = modelSlotsOf(edges('park', 'park', 'park', 'park', 'park', 'park'), 1);
    expect(others).toEqual([]);
    expect(slot!.x).toBeCloseTo(0);
    expect(slot!.z).toBeCloseTo(0);
    expect(slot!.extent).toBeCloseTo(0.6);
  });

  it('puts one model per category on a Hex split in two halves, on opposite sides', () => {
    const slots = modelSlotsOf(edges('habitat', 'habitat', 'habitat', 'water', 'water', 'water'), 1);
    expect(slots.map(slot => slot.category)).toEqual(['habitat', 'water']);
    expect(slots[0]!.x).toBeCloseTo(-slots[1]!.x);
    expect(slots[0]!.z).toBeCloseTo(-slots[1]!.z);
  });

  it('puts the model of a category at the side of its edges', () => {
    const [east] = modelSlotsOf(edges('commerce', 'park', 'park', 'park', 'park', 'park'), 1);
    expect(east!.category).toBe('commerce');
    expect(east!.x).toBeGreaterThan(0.4);
    expect(east!.z).toBeCloseTo(0);
    const [north] = modelSlotsOf(edges('park', 'park', 'industry', 'park', 'park', 'park'), 1).filter(slot => slot.category === 'industry');
    expect(north!.z).toBeLessThan(-0.4);
  });

  it('draws a model wider the more edges its category has, up to three edges', () => {
    const extentOf = (count: number) => modelSlotsOf([...Array(count).fill('service'), ...Array(6 - count).fill('park')] as HexCategory[], 1).find(slot => slot.category === 'service')!.extent;
    expect([1, 2, 3, 4, 5].map(extentOf)).toEqual([0.36, 0.48, 0.6, 0.6, 0.6].map(value => expect.closeTo(value, 6)));
  });

  it('scales with the size of the Hex', () => {
    const [small] = modelSlotsOf(edges('park', 'park', 'park', 'park', 'park', 'park'), 1);
    const [big] = modelSlotsOf(edges('park', 'park', 'park', 'park', 'park', 'park'), 2);
    expect(big!.extent).toBeCloseTo(small!.extent * 2);
  });
});
