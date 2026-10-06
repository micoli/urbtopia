import { mkdtempSync, readFileSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { definitionProblems, readModels, stableModelsJson, writeModels } from './modelsFile';

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
});
