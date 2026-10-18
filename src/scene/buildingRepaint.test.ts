import { describe, expect, it } from 'vitest';
import { BUILDING_SPECS, createBuilding, isRepaintableType, newGame, toneLabelOf, type BuildingType, type ColorVariant } from '../core';
import { MODEL_ENTRIES } from '../core/models/modelFiles';
import { MESSAGES } from '../i18n/messages';
import { renderItemsOf } from './renderItems';

const COLORS = ['default', 'a', 'b', 'c'] as const;

const itemOf = (type: BuildingType, colorVariant: ColorVariant, tier = 1) => {
  const building = { ...createBuilding(1, type, 0, 0, 0), tier, colorVariant };
  return renderItemsOf({ ...newGame({ seed: 'repaint', now: 0 }), buildings: [building] })[0]!;
};

describe('repaint color names', () => {
  it('names every tone of every model, with a translation and a swatch color', () => {
    const tones = Object.values(MODEL_ENTRIES).flatMap(entry => Object.values(entry.tones ?? {}));
    expect(tones.length).toBeGreaterThan(500);
    for (const tone of tones) {
      expect(MESSAGES, tone.name).toHaveProperty(`color.${tone.name}`);
      expect(tone.color).toMatch(/^#[0-9a-f]{6}$/);
    }
  });

  it('gives the Grain silo its own colors, not the Home ones', () => {
    expect(['default', 'a', 'b', 'c'].map(color => toneLabelOf('grainSilo', 5, color as ColorVariant)?.name)).toEqual(['brick', 'tangerine', 'sky', 'mint']);
  });
});

describe('repainted buildings', () => {
  it.each(['home', 'shop', 'shopFood', 'shopLuxury', 'workshop', 'factory', 'packhouse', 'hotel', 'arcade', 'supermarket', 'casino', 'stadium', 'baseballField', 'powerPlant', 'geothermalPlant', 'coalPlant', 'hydroPlant', 'waterTower', 'materialDepot', 'vault', 'storehouse', 'grainSilo'] as const)('repaints the %s by swapping the palette of its single model', (type) => {
    if (!isRepaintableType(type)) return;
    const items = COLORS.map(color => itemOf(type, color, 2));
    expect(new Set(items.map(item => item.model)).size).toBe(1);
    expect(items[0]!.textureVariant).toBeUndefined();
    expect(items.slice(1).map(item => item.textureVariant?.split(':').pop())).toEqual(['b', 'c', 'd']);
  });

  it('names the palette texture after the model and the tone', () => {
    expect(itemOf('grainSilo', 'a', 5).textureVariant).toBe('tone:buildings/silo-2x2-t5-tone-a:b');
    expect(itemOf('grainSilo', 'c', 5).textureVariant).toBe('tone:buildings/silo-2x2-t5-tone-a:d');
  });

  it('leaves the buildings that cannot be repainted alone', () => {
    expect(isRepaintableType('battery')).toBe(false);
    expect(itemOf('battery', 'a').textureVariant).toBeUndefined();
  });

  it('repaints the Transit hub with the palette of its model, and no other stop', () => {
    expect(isRepaintableType('transitHub')).toBe(true);
    expect(COLORS.map(color => itemOf('transitHub', color).textureVariant?.split(':').pop())).toEqual([undefined, 'b', 'c', 'd']);
    expect(['busStop', 'brtStation', 'railStation'].some(isRepaintableType)).toBe(false);
  });

  it('names the four colors of the Transit hub', () => {
    expect(COLORS.map(color => toneLabelOf('transitHub', 1, color)?.name)).toEqual(['mint', 'tangerine', 'sky', 'brick']);
  });

  it('repaints every building drawn with color tones', () => {
    const repaintable = Object.keys(BUILDING_SPECS).filter(id => isRepaintableType(id));
    expect(repaintable.length).toBeGreaterThan(20);
  });
});
