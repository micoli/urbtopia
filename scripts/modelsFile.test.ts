import { mkdtempSync, readFileSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildingTypesSource } from './buildingTypes';
import { BUILDING_TYPES_FILE } from './buildingTypes';
import { definitionProblems, readModels, stableModelsJson, writeModels } from './modelsFile';
import type { ModelDefinition } from '../src/scene/modelDefinitions';

const temporaryFile = () => join(mkdtempSync(join(tmpdir(), 'models-')), 'models.json');

describe('models file', () => {
  it('writes sorted keys and fields atomically', () => {
    const file = temporaryFile();
    writeModels({ 'b/x': { license: 'CC0', source: 'kenney', note: 'n' }, 'a/y': { footprint: [1, 2], license: 'CC0', source: 'managed' } }, file);
    expect(Object.keys(readModels(file))).toEqual(['a/y', 'b/x']);
    expect(readFileSync(file, 'utf8')).toBe(stableModelsJson(readModels(file)));
    expect(Object.keys(readModels(file)['a/y']!)).toEqual(['source', 'license', 'footprint']);
    expect(readdirSync(join(file, '..'))).toEqual(['models.json']);
  });

  it('refuses a definition without a license, with a bad footprint or a bad color', () => {
    expect(definitionProblems({ source: 'kenney', license: ' ' })).toContain('license is required');
    expect(definitionProblems({ source: 'kenney', license: 'CC0', footprint: [0, 1] })).toHaveLength(1);
    expect(definitionProblems({ source: 'kenney', license: 'CC0', recolor: { color: 'red' } })).toHaveLength(1);
    expect(() => writeModels({ 'a/b': { source: 'kenney', license: '' } }, temporaryFile())).toThrow('license is required');
  });

  describe('building definitions', () => {
    const sport: ModelDefinition = {
      source: 'managed', license: 'Own work', footprint: [4, 4],
      building: { kind: 'sport', id: 'arena', name: { en: 'Arena', fr: 'Arène' }, description: { en: 'An arena.', fr: 'Une arène.' }, unlockCitizens: 100, cost: 500, radius: 6, wellbeingBonus: 4 },
    };
    const nature: ModelDefinition = { source: 'kenney', license: 'CC0', building: { kind: 'nature', id: 'nature-oak', family: 'tree', name: { en: 'Oak', fr: 'Chêne' } } };

    it('accepts a complete sport or nature building', () => {
      expect(definitionProblems(sport)).toEqual([]);
      expect(definitionProblems(nature)).toEqual([]);
    });

    it('refuses an incomplete building', () => {
      expect(definitionProblems({ ...sport, footprint: undefined })).toContain('a sport building needs a footprint');
      expect(definitionProblems({ ...sport, building: { ...sport.building!, name: { en: 'Arena', fr: ' ' } } as never })).toContain('building name is required in en and fr');
      expect(definitionProblems({ ...sport, building: { ...sport.building!, cost: -1 } as never })).toContain('unlock, cost and bonus must be integers >= 0');
      expect(definitionProblems({ ...nature, building: { kind: 'nature', id: 'x', family: 'moss', name: { en: 'X', fr: 'X' } } as never })).toContain('unknown nature family');
      expect(definitionProblems({ ...nature, building: { ...nature.building!, id: '1bad' } as never })).toHaveLength(1);
    });

    it('refuses two models sharing a building id', () => {
      expect(() => writeModels({ 'a/one': nature, 'a/two': nature }, temporaryFile())).toThrow('used by several models');
    });

    it('keeps the generated building types in sync with models.json', () => {
      expect(readFileSync(BUILDING_TYPES_FILE, 'utf8')).toBe(buildingTypesSource(readModels()));
    });
  });
});
