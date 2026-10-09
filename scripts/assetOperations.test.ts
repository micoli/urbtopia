import { existsSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { zipSync } from 'fflate';
import { describe, expect, it } from 'vitest';
import { addGlb, addPack, addPolyPizzaModel, removeModel, renameModel, type AssetPaths } from './assetOperations';
import { readBuildings, writeBuildings } from './buildingsFile';
import { readModels } from './modelsFile';
import { fetchPolyPizzaModel, publicIdOf } from './polyPizza';

const workspace = (): AssetPaths => {
  const root = mkdtempSync(join(tmpdir(), 'assets-'));
  const paths = { managed: join(root, 'managed'), polyPizza: join(root, 'poly'), kenney: join(root, 'kenney'), quaternius: join(root, 'quaternius'), models: join(root, 'models.json'), extraPacks: join(root, 'extra.json'), buildings: join(root, 'buildings') };
  writeFileSync(paths.models, '{}\n');
  return paths;
};

const data = new Uint8Array([1, 2, 3]);

describe('asset operations', () => {
  it('adds a hand-made GLB with its definition', () => {
    const paths = workspace();
    expect(addGlb({ category: 'sport', name: 'pool', data, license: 'CC0', author: 'me' }, paths)).toBe('sport/pool');
    expect(existsSync(join(paths.managed, 'sport/pool.glb'))).toBe(true);
    expect(readModels(paths.models)['sport-pool']).toEqual({ file: 'sport/pool', source: 'managed', license: 'CC0', author: 'me' });
  });

  it('refuses a missing license, a bad name and a duplicate', () => {
    const paths = workspace();
    expect(() => addGlb({ category: 'sport', name: 'pool', data, license: ' ' }, paths)).toThrow('license is required');
    expect(() => addGlb({ category: 'Sport', name: 'pool', data, license: 'CC0' }, paths)).toThrow('category');
    addGlb({ category: 'sport', name: 'pool', data, license: 'CC0' }, paths);
    expect(() => addGlb({ category: 'sport', name: 'pool', data, license: 'CC0' }, paths)).toThrow('already exists');
  });

  it('adds a Poly Pizza model with its license file', () => {
    const paths = workspace();
    const model = { slug: 'bank', title: 'Bank', author: 'Poly by Google', url: 'https://poly.pizza/m/abc', glb: data };
    expect(addPolyPizzaModel(model, 'CC-BY 3.0', paths)).toBe('poly.pizza/bank');
    expect(readFileSync(join(paths.polyPizza, 'bank/license.txt'), 'utf8')).toContain('License: CC-BY 3.0');
    expect(readModels(paths.models)['poly-pizza-bank']).toMatchObject({ file: 'poly.pizza/bank', source: 'poly.pizza', author: 'Poly by Google' });
    expect(() => addPolyPizzaModel(model, '', paths)).toThrow('license is required');
  });

  it('removes a model unless the game uses it', () => {
    const paths = workspace();
    addGlb({ category: 'sport', name: 'pool', data, license: 'CC0' }, paths);
    expect(() => removeModel('sport/pool', ['sport/pool'], paths)).toThrow('used in the game');
    removeModel('sport/pool', [], paths);
    expect(existsSync(join(paths.managed, 'sport'))).toBe(false);
    expect(readModels(paths.models)).toEqual({});
    expect(() => removeModel('roads/road-bend', [], paths)).toThrow('not a hand-made');
  });

  it('renames a Model id and every building that uses it', () => {
    const paths = workspace();
    addGlb({ category: 'sport', name: 'pool', data, license: 'CC0' }, paths);
    const pool = { kind: 'standard' as const, section: 'build.sport' as const, model: 'sport-pool', footprint: [1, 1] as [number, number], cost: 1, unlockCitizens: 0, requiresRoad: true, name: { en: 'Pool', fr: 'Piscine' } };
    writeBuildings({ pool, other: { ...pool, model: 'sport-pool' } }, paths.buildings);
    expect(() => renameModel('sport-pool', 'Bad Id', paths)).toThrow('id must be lowercase');
    expect(() => renameModel('missing', 'pool', paths)).toThrow('Unknown Model id');
    renameModel('sport-pool', 'swimming-pool', paths);
    expect(readModels(paths.models)['swimming-pool']).toMatchObject({ file: 'sport/pool' });
    expect(Object.values(readBuildings(paths.buildings)).map(({ model }) => model)).toEqual(['swimming-pool', 'swimming-pool']);
    expect(readdirSync(paths.buildings).map(file => readFileSync(join(paths.buildings, file), 'utf8')).join('')).not.toContain('sport-pool');
  });

  it('registers a Quaternius zip only if it holds FBX files', () => {
    const paths = workspace();
    expect(() => addPack({ kind: 'quaternius', name: 'city', archive: 'city.zip', data: zipSync({ 'readme.txt': data }) }, paths)).toThrow('No FBX');
    addPack({ kind: 'quaternius', name: 'city', archive: 'city.zip', data: zipSync({ 'Models/House.fbx': data }) }, paths);
    expect(JSON.parse(readFileSync(paths.extraPacks, 'utf8')).quaternius).toEqual([{ name: 'city', archive: 'city.zip' }]);
    expect(existsSync(join(paths.quaternius, 'city.zip'))).toBe(true);
    expect(() => addPack({ kind: 'quaternius', name: 'city', archive: 'other.zip', data: zipSync({ 'a.fbx': data }) }, paths)).toThrow('already exists');
  });

  it('registers a Kenney zip with or without colormap', () => {
    const paths = workspace();
    addPack({ kind: 'kenney', name: 'plain', archive: 'plain.zip', data: zipSync({ 'Models/GLB format/a.glb': data }) }, paths);
    addPack({ kind: 'kenney', name: 'mapped', archive: 'mapped.zip', data: zipSync({ 'Models/GLB format/a.glb': data, 'Models/GLB format/Textures/colormap.png': data }) }, paths);
    expect(JSON.parse(readFileSync(paths.extraPacks, 'utf8')).kenney).toEqual([{ name: 'plain', archive: 'plain.zip', colormap: false }, { name: 'mapped', archive: 'mapped.zip', colormap: true }]);
  });
});

describe('poly pizza import', () => {
  it('reads an id from a URL', () => {
    expect(publicIdOf('https://poly.pizza/m/f1GOJtZFtsR')).toBe('f1GOJtZFtsR');
    expect(publicIdOf('f1GOJtZFtsR')).toBe('f1GOJtZFtsR');
    expect(() => publicIdOf('https://example.com/x y')).toThrow('Not a Poly Pizza');
  });

  it('finds the title, author and model file in the page', async () => {
    const page = '<meta property="og:title" content="Big Barn - Free Model By Poly by Google"/><a href="https://static.poly.pizza/d045642d-b3a6-4cb5-98b9-8f1e600a99b4.glb&amp;x">';
    const download = async (url: string) => (url.endsWith('.glb') ? new Response(data) : new Response(page));
    const model = await fetchPolyPizzaModel('https://poly.pizza/m/abc', download);
    expect(model).toMatchObject({ slug: 'big-barn', title: 'Big Barn', author: 'Poly by Google', url: 'https://poly.pizza/m/abc' });
    expect([...model.glb]).toEqual([1, 2, 3]);
  });
});
