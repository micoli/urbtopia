import { describe, expect, it } from 'vitest';
import { BUILDING_SPECS, ECOLOGY, ECOLOGY_UNLOCKS, TRANSIT, maxTierOf, type BuildingType } from '../core';
import { CODEX_ENTRIES, codexImageKey, validateCodex, validateCodexManifest } from './catalog';
import { ROAD_CONSTRUCTIONS } from './construction';
import { codexSnapshot } from './snapshot';
import { modelOfBuilding, renderItemsOf } from '../scene/renderItems';

describe('codex coverage gate', () => {
  it('requires a complete page for every constructible, including locked objects', () => {
    expect(() => validateCodex()).not.toThrow();
    const expected = [...Object.keys(BUILDING_SPECS), 'solarHome', ...ROAD_CONSTRUCTIONS.map(item => item.id)];
    expect(CODEX_ENTRIES.map(entry => entry.id).sort()).toEqual(expected.sort());
    for (const id of expected) {
      expect(() => validateCodex(CODEX_ENTRIES.filter(entry => entry.id !== id)), id).toThrow('Every constructible');
    }
  });

  it('requires every evolution and both translations', () => {
    for (const entry of CODEX_ENTRIES) {
      expect(() => validateCodex(CODEX_ENTRIES.map(item => item === entry ? { ...item, levels: [] } : item))).toThrow('Missing codex levels');
      expect(() => validateCodex(CODEX_ENTRIES.map(item => item === entry ? { ...item, description: 'codex.missing' as typeof item.description } : item))).toThrow('Missing codex translation');
    }
  });

  it('reads building and network thresholds from gameplay rules', () => {
    for (const entry of CODEX_ENTRIES.filter(entry => entry.id in BUILDING_SPECS)) {
      expect(entry.unlockCitizens).toBe(ECOLOGY_UNLOCKS[entry.id as BuildingType] ?? 0);
      expect(entry.levels).toHaveLength(maxTierOf(entry.id as BuildingType));
    }
    expect(CODEX_ENTRIES.find(entry => entry.id === 'solarHome')?.unlockCitizens).toBe(ECOLOGY.solarUnlockCitizens);
    expect(CODEX_ENTRIES.find(entry => entry.id === 'brt')?.unlockCitizens).toBe(TRANSIT.brt.unlock);
    expect(CODEX_ENTRIES.find(entry => entry.id === 'rail')?.unlockCitizens).toBe(TRANSIT.rail.unlock);
  });

  it('blocks a manifest when any level image is missing', () => {
    const images = Object.fromEntries(CODEX_ENTRIES.flatMap(entry => entry.levels.map(level => [codexImageKey(entry.id, level), 'preview.png'])));
    expect(() => validateCodexManifest({ fingerprint: 'test', images })).not.toThrow();
    for (const key of Object.keys(images)) {
      const incomplete = { ...images };
      delete incomplete[key];
      expect(() => validateCodexManifest({ fingerprint: 'test', images: incomplete })).toThrow('Missing codex image');
    }
  });
});

describe('codex snapshots', () => {
  it('uses real models for all building tiers and keeps all solar Home panels', () => {
    for (const entry of CODEX_ENTRIES.filter(entry => entry.id in BUILDING_SPECS || entry.id === 'solarHome')) {
      for (const level of entry.levels) {
        const state = codexSnapshot(entry.id, level);
        const building = state.buildings[0]!;
        expect(building.tier).toBe(level);
        expect(state.buildings).toHaveLength(1);
        const items = renderItemsOf(state);
        expect(items[0]?.model).toBe(modelOfBuilding(building));
        if (entry.id === 'solarHome') {
          expect(building.solar).toBe(true);
          if (level > 4) expect(items.some(item => !!item.roofBase)).toBe(true);
        }
      }
    }
  });

  it('creates isolated representative road networks', () => {
    expect(codexSnapshot('roundabout', 1).roundabouts).toHaveLength(1);
    expect(codexSnapshot('crossing', 1).roads[1]?.kind).toBe('crossing');
    expect(codexSnapshot('brt', 1).brtRoads).toHaveLength(3);
    expect(codexSnapshot('rail', 1).rails).toHaveLength(3);
    expect(codexSnapshot('rail', 1).buildings).toHaveLength(0);
  });
});
