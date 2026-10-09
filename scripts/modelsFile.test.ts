import { mkdtempSync, readFileSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { MODEL_IDS_FILE, MODELS_SCHEMA_FILE, modelIdOf, modelIdsSource, modelProblems, modelsJsonSchema, modelsProblems, readModels, stableModelsJson, writeModels } from './modelsFile';

const temporaryFile = () => join(mkdtempSync(join(tmpdir(), 'models-')), 'models.json');

describe('models file', () => {
  it('writes sorted ids and fields atomically, after a $schema reference', () => {
    const file = temporaryFile();
    writeModels({ 'b-x': { license: 'CC0', source: 'kenney', note: 'n', file: 'b/x' }, 'a-y': { footprint: [1, 2], license: 'CC0', source: 'managed', file: 'a/y' } }, file);
    expect(Object.keys(JSON.parse(readFileSync(file, 'utf8')))).toEqual(['$schema', 'a-y', 'b-x']);
    expect(Object.keys(readModels(file))).toEqual(['a-y', 'b-x']);
    expect(readFileSync(file, 'utf8')).toBe(stableModelsJson(readModels(file)));
    expect(Object.keys(readModels(file)['a-y']!)).toEqual(['file', 'source', 'license', 'footprint']);
    expect(readdirSync(join(file, '..'))).toEqual(['models.json']);
  });

  it('refuses a definition without a license, with a bad footprint, a bad color or no file', () => {
    expect(modelProblems({ file: 'a/b', source: 'kenney', license: ' ' })).toContain('license is required');
    expect(modelProblems({ file: 'a/b', source: 'kenney', license: 'CC0', footprint: [0, 1] })).toHaveLength(1);
    expect(modelProblems({ file: 'a/b', source: 'kenney', license: 'CC0', recolor: { color: 'red' } })).toHaveLength(1);
    expect(modelProblems({ source: 'kenney', license: 'CC0' })).toHaveLength(1);
    expect(() => writeModels({ 'a-b': { file: 'a/b', source: 'kenney', license: '' } }, temporaryFile())).toThrow('license is required');
  });

  it('refuses a bad id and a file shared by two ids', () => {
    const model = { file: 'a/b', source: 'kenney' as const, license: 'CC0' };
    expect(modelsProblems({ 'A_b': model })).toEqual(['A_b: id must be lowercase letters and digits separated by single dashes']);
    expect(modelsProblems({ 'a-b': model, other: model })).toEqual(['other: file a/b already belongs to a-b']);
  });

  it('names a model after its file', () => {
    expect(modelIdOf('suburban/building-type-k')).toBe('suburban-building-type-k');
    expect(modelIdOf('buildings/2Story_Stairs_Mat')).toBe('buildings-2story-stairs-mat');
    expect(modelIdOf('poly.pizza/pool-table')).toBe('poly-pizza-pool-table');
  });
});

describe('assets/models.json', () => {
  it('keeps the generated Model ids and JSON Schema in sync (npm run defs:generate)', () => {
    expect(readFileSync(MODEL_IDS_FILE, 'utf8')).toBe(modelIdsSource(readModels()));
    expect(readFileSync(MODELS_SCHEMA_FILE, 'utf8')).toBe(modelsJsonSchema());
  });
});
