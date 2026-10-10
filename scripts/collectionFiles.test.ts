import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { idTypesSource, jsonSchemaOf, schemaFileOf, singletonJsonSchemaOf, singletonSchemaFileOf, writeCollection } from './collectionFiles';
import { readCollection, readCollectionDir, readCollections } from './collectionRead';
import { COLLECTION_NAMES, specOf } from './collections';
import { collectionProblems } from './definitionProblems';
import { SINGLETON_NAMES } from './singletons';

const wood = { kind: 'material', name: { en: 'Wood', fr: 'Bois' }, producedBy: 'workshop', durationMinutes: 1, unlockCitizens: 0, minTier: 1 };
const planks = { kind: 'good', order: 10, category: 'construction', name: { en: 'Planks', fr: 'Planches' }, recipe: { wood: 2 }, durationMinutes: 2, value: 14, unlockCitizens: 0, minTier: 1 };

describe('collections on disk', () => {
  it.each(COLLECTION_NAMES)('keeps the generated id unions and JSON Schema of %s in sync (npm run defs:generate)', name => {
    expect(readFileSync(specOf(name).idTypes.file, 'utf8')).toBe(idTypesSource(name, readCollection(name)));
    expect(readFileSync(schemaFileOf(name), 'utf8')).toBe(jsonSchemaOf(name));
  });

  it.each(SINGLETON_NAMES)('keeps the JSON Schema of %s in sync', name => {
    expect(readFileSync(singletonSchemaFileOf(name), 'utf8')).toBe(singletonJsonSchemaOf(name));
  });

  it('checks every recipe against the Materials and Crops', () => {
    const collections = readCollections();
    expect(collectionProblems('goods', collections.goods, { collections })).toEqual([]);
  });
});

describe('Shop definitions', () => {
  const collections = readCollections();
  const shop = (patch: Record<string, unknown>, sells: string[]) => ({ ...collections.buildings.shopConstruction!, ...patch, tiers: [{ ...(collections.buildings.shopConstruction!.tiers as Record<string, unknown>[])[0], sells }] });
  const problems = (definition: unknown) => collectionProblems('buildings', { shopCopy: definition as never }, { collections }).filter(({ path }) => path.includes('sells'));

  it('accepts the Goods of the Shop category', () => {
    expect(problems(shop({}, ['planks', 'bricks']))).toEqual([]);
  });

  it('reports a Good of another category in a specialised Shop', () => {
    expect(problems(shop({}, ['planks', 'tools']))).toEqual([{ id: 'shopCopy', path: 'tiers.0.sells.1', message: 'tools is a equipment Good, not construction' }]);
  });

  it('lets the General shop list every category', () => {
    expect(problems(shop({ goodCategory: 'all' }, ['planks', 'tools']))).toEqual([]);
  });

  it('reports a Good that does not exist', () => {
    expect(problems(shop({}, ['planks', 'unobtainium']))).toEqual([{ id: 'shopCopy', path: 'tiers.0.sells.1', message: 'unknown goods id unobtainium' }]);
  });
});

describe('collection files', () => {
  it('writes and reads a collection in its order, with camelCase item ids', () => {
    const dir = mkdtempSync(join(tmpdir(), 'materials-'));
    writeCollection('materials', { wood, stone: { ...wood, name: { en: 'Stone', fr: 'Pierre' } } }, dir);
    expect(Object.keys(readCollectionDir(dir))).toEqual(['wood', 'stone']);
    expect(() => writeCollection('materials', { 'bad-id': wood }, dir)).toThrow('id must be camelCase');
  });

  it('reports a recipe naming an unknown Material', () => {
    const collections = { materials: { wood }, crops: {} };
    expect(collectionProblems('goods', { planks }, { collections })).toEqual([]);
    expect(collectionProblems('goods', { planks: { ...planks, recipe: { iron: 1 } } }, { collections })).toEqual([{ id: 'planks', path: 'recipe.iron', message: 'unknown materials or crops id iron' }]);
    expect(collectionProblems('goods', { planks: { ...planks, recipe: {} } })).toHaveLength(1);
  });
});
