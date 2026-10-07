import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { BuildingDefinition } from '../src/core/buildings/buildingDefinition';
import { BUILDING_TYPES_FILE, buildingTypesSource } from './buildingTypes';
import { buildingProblems, readBuildings, stableBuildingsJson, writeBuildings } from './buildingsFile';

const temporaryFile = () => join(mkdtempSync(join(tmpdir(), 'buildings-')), 'buildings.json');

const standard: BuildingDefinition = {
  section: 'build.production', model: 'industrial/building-h', footprint: [2, 2], cost: 100, unlockCitizens: 0, requiresRoad: true,
  name: { en: 'Workshop', fr: 'Atelier' },
};
const sport: BuildingDefinition = { ...standard, section: 'build.sport', description: { en: 'An arena.', fr: 'Une arène.' }, sport: { radius: 6, wellbeingBonus: 4 } };
const nature: BuildingDefinition = { model: 'nature/tree_oak', name: { en: 'Oak', fr: 'Chêne' }, nature: { family: 'tree' } };

describe('buildings file', () => {
  it('accepts standard, sport and nature buildings', () => {
    for (const definition of [standard, sport, nature]) expect(buildingProblems(definition)).toEqual([]);
  });

  it('refuses incomplete buildings', () => {
    expect(buildingProblems({ ...standard, footprint: undefined })).toContain('footprint must be two integers >= 1');
    expect(buildingProblems({ ...standard, cost: -1 })).toContain('cost must be an integer >= 0');
    expect(buildingProblems({ ...standard, section: 'build.nowhere' as never })).toContain('unknown section');
    expect(buildingProblems({ ...standard, name: { en: 'Workshop', fr: ' ' } })).toContain('name is required in en and fr');
    expect(buildingProblems({ ...standard, description: { en: 'Text', fr: '' } })).toHaveLength(1);
    expect(buildingProblems({ ...sport, sport: { radius: 0, wellbeingBonus: 4 } })).toHaveLength(1);
    expect(buildingProblems({ ...nature, nature: { family: 'moss' as never } })).toContain('unknown nature family');
    expect(buildingProblems({ ...nature, cost: 10 })).toHaveLength(1);
    expect(buildingProblems({ ...sport, nature: { family: 'tree' } })).toContain('a building cannot be both sport and nature');
  });

  it('refuses a bad id when writing', () => {
    expect(() => writeBuildings({ '1bad': standard }, temporaryFile())).toThrow('id must start with a letter');
  });

  it('keeps the order of the buildings and of their fields', () => {
    const file = temporaryFile();
    writeBuildings({ zebra: standard, alpha: nature, middle: sport }, file);
    expect(Object.keys(readBuildings(file))).toEqual(['zebra', 'alpha', 'middle']);
    expect(Object.keys(readBuildings(file).zebra!)).toEqual(['section', 'model', 'footprint', 'cost', 'unlockCitizens', 'requiresRoad', 'name']);
    expect(readFileSync(file, 'utf8')).toBe(stableBuildingsJson(readBuildings(file)));
  });

  it('keeps the generated building types in sync with buildings.json', () => {
    expect(readFileSync(BUILDING_TYPES_FILE, 'utf8')).toBe(buildingTypesSource(readBuildings()));
  });
});
