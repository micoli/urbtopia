import { describe, expect, it } from 'vitest';
import { createBuilding, footprintOf, maxTierOf, newGame, type BuildingType, type HomeColorVariant } from '../core';
import { MODEL_KEYS, renderItemsOf } from './renderItems';

const MANSARD_TYPES = ['home-mansard-1x1', 'home-mansard-1x2', 'home-mansard-2x2'] as BuildingType[];
const LETTERS: Record<HomeColorVariant, string> = { default: 'a', a: 'b', b: 'c', c: 'd' };
const COLORS = Object.keys(LETTERS) as HomeColorVariant[];

describe('mansard Homes', () => {
  it.each(MANSARD_TYPES)('%s has five Tiers on a fixed footprint', type => {
    expect(maxTierOf(type)).toBe(5);
    const [width, depth] = type.slice('home-mansard-'.length).split('x').map(Number);
    for (let tier = 1; tier <= 5; tier++) expect(footprintOf(type, 0, tier)).toEqual({ width, depth });
  });

  it.each(MANSARD_TYPES)('%s renders a preloaded model for every Tier, color and solar option', type => {
    for (let tier = 1; tier <= 5; tier++) for (const colorVariant of COLORS) for (const solar of [false, true]) {
      const building = { ...createBuilding(1, type, 0, 0, 0), tier, colorVariant, solar };
      const items = renderItemsOf({ ...newGame({ seed: 'mansard', now: 0 }), buildings: [building] }).filter(item => item.model.includes('mansard'));
      expect(items, `${type} tier ${tier} ${colorVariant} ${solar}`).toHaveLength(1);
      const [item] = items;
      expect(MODEL_KEYS).toContain(item!.model);
      expect(item!.model).toContain(`${tier}f-mansard-${LETTERS[colorVariant]}${solar ? '-solar' : ''}`);
      expect(item!.textureVariant).toBeUndefined();
    }
  });
});
