import { existsSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { definitionProblems } from '../build/validateDefinitions';
import type { FlatBuilding } from '../src/core/buildings/buildingDefinition';
import { BUILDING_TYPES_FILE, buildingTypesSource } from './buildingTypes';
import { BUILDING_SCHEMA_FILE, buildingJsonSchema, buildingProblems, buildingsProblems, readBuildings, stableBuildingJson, writeBuildings } from './buildingsFile';

const temporaryDir = () => mkdtempSync(join(tmpdir(), 'buildings-'));

const standard: FlatBuilding = {
  kind: 'standard', section: 'build.production', model: 'industrial/building-h', footprint: [2, 2], cost: 100, unlockCitizens: 0, requiresRoad: true,
  name: { en: 'Workshop', fr: 'Atelier' },
};
const sport: FlatBuilding = { ...standard, kind: 'sport', section: 'build.sport', description: { en: 'An arena.', fr: 'Une arène.' }, radius: 6, wellbeingBonus: 4 };
const nature: FlatBuilding = { kind: 'nature', model: 'nature/tree_oak', name: { en: 'Oak', fr: 'Chêne' }, family: 'tree' };
const ordered = (building: FlatBuilding) => ({ ...building, order: 10 });

describe('building files', () => {
  it('accepts standard, sport and nature buildings', () => {
    for (const definition of [standard, sport, nature]) expect(buildingProblems(ordered(definition))).toEqual([]);
  });

  it('refuses incomplete buildings', () => {
    const problemsOf = (definition: object) => buildingProblems(ordered(definition as FlatBuilding)).join('; ');
    expect(problemsOf({ ...standard, footprint: undefined })).toContain('footprint');
    expect(problemsOf({ ...standard, footprint: [0, 1] })).toContain('footprint.0');
    expect(problemsOf({ ...standard, accessModes: [] })).toContain('accessModes');
    expect(problemsOf({ ...standard, accessModes: ['rail'] })).toContain('accessModes.0');
    expect(problemsOf({ ...standard, requiresRoad: false, accessModes: ['road'] })).toContain('accessModes needs requiresRoad');
    expect(problemsOf({ ...standard, cost: -1 })).toContain('cost');
    expect(problemsOf({ ...standard, cost: 1.5 })).toContain('cost');
    expect(problemsOf({ ...standard, section: 'build.nowhere' })).toContain('section');
    expect(problemsOf({ ...standard, name: { en: 'Workshop', fr: ' ' } })).toContain('name.fr: must not be blank');
    expect(problemsOf({ ...standard, description: { en: 'Text', fr: '' } })).toContain('description.fr');
    expect(problemsOf({ ...sport, radius: 0 })).toContain('radius');
    expect(problemsOf({ ...nature, family: 'moss' })).toContain('family');
    expect(problemsOf({ ...nature, cost: 10 })).toContain('cost');
    expect(problemsOf({ ...standard, radius: 4 })).toContain('radius');
    expect(problemsOf({ ...standard, kind: 'castle' })).toContain('kind');
  });

  it('refuses bad ids, ids differing by case only and unknown models', () => {
    expect(() => writeBuildings({ '1bad': standard }, temporaryDir())).toThrow('id must start with a letter');
    expect(buildingsProblems({ parka: ordered(nature), parkA: ordered(nature) })).toEqual(['parkA: id differs from another one by case only']);
    expect(buildingsProblems({ oak: ordered(nature) }, new Set(['nature/tree_pine']))).toEqual(['oak: unknown model nature/tree_oak']);
  });

  it('writes one file per building, in menu order, and removes the files of removed buildings', () => {
    const dir = temporaryDir();
    writeBuildings({ zebra: standard, alpha: nature, middle: sport }, dir);
    expect(readdirSync(dir).sort()).toEqual(['alpha.json', 'middle.json', 'zebra.json']);
    expect(Object.keys(readBuildings(dir))).toEqual(['zebra', 'alpha', 'middle']);
    expect(readBuildings(dir).zebra!.order).toBe(10);
    writeBuildings({ middle: sport, zebra: standard }, dir);
    expect(existsSync(join(dir, 'alpha.json'))).toBe(false);
    expect(Object.keys(readBuildings(dir))).toEqual(['middle', 'zebra']);
  });

  it('writes stable files: schema first, fields in a fixed order, short arrays on one line', () => {
    const dir = temporaryDir();
    writeBuildings({ zebra: { ...standard, accessModes: ['road', 'brt'] } }, dir);
    const content = readFileSync(join(dir, 'zebra.json'), 'utf8');
    expect(Object.keys(JSON.parse(content))).toEqual(['$schema', 'kind', 'order', 'section', 'model', 'footprint', 'cost', 'unlockCitizens', 'requiresRoad', 'accessModes', 'name']);
    expect(content).toContain('"footprint": [2, 2],');
    expect(content).toContain('"accessModes": ["road", "brt"],');
    expect(content).toBe(stableBuildingJson(readBuildings(dir).zebra!));
  });

  it('orders hand-edited buildings of equal order by id', () => {
    const dir = temporaryDir();
    writeFileSync(join(dir, 'beta.json'), JSON.stringify({ ...nature, order: 5 }));
    writeFileSync(join(dir, 'alpha.json'), JSON.stringify({ ...nature, order: 5 }));
    expect(Object.keys(readBuildings(dir))).toEqual(['alpha', 'beta']);
  });
});

describe('assets/defs/buildings', () => {
  it('holds only valid buildings whose models exist', () => {
    expect(definitionProblems()).toEqual([]);
  });

  it('keeps the generated building types and JSON Schema in sync (npm run defs:generate)', () => {
    expect(readFileSync(BUILDING_TYPES_FILE, 'utf8')).toBe(buildingTypesSource(readBuildings()));
    expect(readFileSync(BUILDING_SCHEMA_FILE, 'utf8')).toBe(buildingJsonSchema());
  });
});
