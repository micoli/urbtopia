import { describe, expect, it } from 'vitest';
import { BUILDING_SPECS, CROPS, CROP_IDS, FACILITIES, FACILITY_TYPES, ECOLOGY, ECOLOGY_UNLOCKS, TRANSIT, maxTierOf, type BuildingType } from '../core';
import { CODEX_ENTRIES, codexImageKey, HOME_COLOR_VARIANTS, validateCodex, validateCodexManifest } from './catalog';
import { ROAD_CONSTRUCTIONS } from './construction';
import { codexSnapshot } from './snapshot';
import { MESSAGES } from '../i18n/messages';
import { FR } from '../i18n/fr';
import { growthModelOf, produceModelOf } from '../scene/cropModels';
import { modelOfBuilding, renderItemsOf } from '../scene/renderItems';

describe('codex coverage gate', () => {
  it('offers natural models from all three packs with Citizen unlocks', () => {
    const expected = [
      ['nature-tree-oak', 'nature/tree_oak', 6],
      ['nature-flower-purpleA', 'nature/flower_purpleA', 15],
      ['pirate-palm-bend', 'pirate/palm-bend', 60],
      ['pirate-grass', 'pirate/grass', 6],
      ['mini-forest-tree', 'mini-forest/tree', 32],
      ['mini-forest-rocks-low', 'mini-forest/rocks-low', 15],
    ] as const;
    for (const [id, model, threshold] of expected) {
      const entry = CODEX_ENTRIES.find(entry => entry.id === id);
      expect(entry, id).toBeDefined();
      expect(entry?.unlockCitizens).toBe(threshold);
      expect(renderItemsOf(codexSnapshot(entry!.id, 1))[0]?.model).toBe(model);
    }
    expect(CODEX_ENTRIES.some(entry => /nature-tree.*detailed/i.test(entry.id))).toBe(false);
  });

  it('documents every Public facility in both languages with its unlock threshold', () => {
    for (const type of FACILITY_TYPES) {
      const entry = CODEX_ENTRIES.find(item => item.id === type);
      expect(entry?.section, type).toBe('build.publicFacilities');
      expect(entry?.unlockCitizens).toBe(FACILITIES[type].unlockCitizens);
      for (const language of [MESSAGES, FR]) {
        expect(language[entry!.name].trim()).not.toBe('');
        expect(language[entry!.description].trim()).not.toBe('');
        expect(language[`event.unlocked.${type}`].trim()).not.toBe('');
      }
    }
  });

  it('states reach, capacity range, demand, unlock and cost in each Public facility description', () => {
    for (const type of FACILITY_TYPES) {
      const spec = FACILITIES[type];
      const entry = CODEX_ENTRIES.find(item => item.id === type)!;
      const english = MESSAGES[entry.description];
      expect(english).toContain(spec.radius === null ? 'whole city' : `${2 * spec.radius} tiles`);
      expect(english).toContain(`${spec.unlockCitizens} Citizens`);
      expect(english).toContain(`${spec.cost} Urbs`);
      expect(english).toContain(spec.capacity === null ? 'unlimited' : `Tier 8`);
      expect(english).toContain(`demand ${spec.power} power`);
      expect(FR[entry.description]).toContain(`${spec.cost} Urbs`);
    }
    expect(MESSAGES['codex.description.hospital']).toContain('2 water');
  });

  it('requires a complete page for every constructible, including locked objects', () => {
    expect(() => validateCodex()).not.toThrow();
    const expected = [...Object.keys(BUILDING_SPECS), 'solarHome', ...ROAD_CONSTRUCTIONS.map(item => item.id), ...CROP_IDS];
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
    const images = Object.fromEntries(CODEX_ENTRIES.flatMap(entry => entry.levels.flatMap(level => {
      const colors = entry.id === 'home' || entry.id === 'solarHome' ? HOME_COLOR_VARIANTS : [undefined];
      return colors.map(color => [codexImageKey(entry.id, level, color), 'preview.png']);
    })));
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

describe('crop codex', () => {
  it('documents every species in the crops section with its Unlock threshold and five stages', () => {
    for (const id of CROP_IDS) {
      const entry = CODEX_ENTRIES.find(item => item.id === id);
      expect(entry?.section, id).toBe('codex.crops');
      expect(entry?.unlockCitizens).toBe(CROPS[id].unlockCitizens);
      expect(entry?.levels).toEqual([1, 2, 3, 4, 5]);
      for (const language of [MESSAGES, FR]) expect(language[entry!.name].trim()).not.toBe('');
    }
  });

  it('shows one planted Field at each growth stage, then the ready Crop', () => {
    for (const id of CROP_IDS) {
      for (const level of [1, 2, 3, 4]) {
        const models = renderItemsOf(codexSnapshot(id, level)).map(item => item.model);
        expect(models, `${id} ${level}`).toContain(growthModelOf(id, level as 1 | 2 | 3 | 4));
      }
      const ready = renderItemsOf(codexSnapshot(id, 5)).map(item => item.model);
      expect(ready).toContain(growthModelOf(id, 4));
      const produce = produceModelOf(id);
      if (produce) expect(ready).toContain(produce);
    }
  });
});
