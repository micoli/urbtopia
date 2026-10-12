import { describe, expect, it } from 'vitest';
import { createBuilding, newGame, type BuildingType, type ColorVariant } from '../core';
import { renderItemsOf } from './renderItems';

const textureVariantOf = (type: BuildingType, colorVariant: ColorVariant, tier = 1) => {
  const building = { ...createBuilding(1, type, 0, 0, 0), tier, colorVariant };
  return renderItemsOf({ ...newGame({ seed: 'repaint', now: 0 }), buildings: [building] }).find(item => item.model.includes('building-'))?.textureVariant;
};

describe('repainted buildings', () => {
  it('swaps the suburban palette of a Home', () => {
    expect(textureVariantOf('home', 'c')).toBe('c');
    expect(textureVariantOf('home', 'default')).toBeUndefined();
  });

  it('swaps the commercial palette of a shop and of the hotel', () => {
    expect(textureVariantOf('shop', 'a')).toBe('commercial-a');
    expect(textureVariantOf('shop', 'b')).toBe('commercial-b');
    expect(textureVariantOf('hotel', 'a')).toBe('commercial-a');
  });

  it('swaps the industrial palette of a workshop', () => {
    expect(textureVariantOf('workshop', 'c')).toBe('industrial-c');
    expect(textureVariantOf('workshop', 'default')).toBeUndefined();
  });

  it('keeps the default palette where the kit has no such variation', () => {
    expect(textureVariantOf('shop', 'c')).toBeUndefined();
  });
});
