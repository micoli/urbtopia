import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ARCHIVES_DIR, ASSET_PACKS, MANAGED_MODELS_DIR, POLY_PIZZA_DIR, QUATERNIUS_ARCHIVES_DIR, QUATERNIUS_PACKS } from '../../scripts/assetPacks';
import { extractFbx, extractPack } from '../../scripts/extractPack';
import { managedModelKeys } from '../../scripts/managedModels';
import { definitionProblems } from '../../scripts/modelsFile';
import { MODEL_DEFINITIONS, recolorOf, type ModelSource } from './modelDefinitions';

const keysBySource = (): Map<string, ModelSource> => {
  const keys = new Map<string, ModelSource>();
  const add = (key: string, source: ModelSource) => {
    expect(keys.has(key), `key collision: ${key}`).toBe(false);
    keys.set(key, source);
  };
  for (const pack of ASSET_PACKS) {
    const files = extractPack(new Uint8Array(readFileSync(join(ARCHIVES_DIR, pack.archive))), 'all', pack.colormap);
    for (const { path } of files) if (path.endsWith('.glb')) add(`${pack.name}/${path.slice(0, -'.glb'.length)}`, 'kenney');
  }
  for (const pack of QUATERNIUS_PACKS) {
    const files = extractFbx(new Uint8Array(readFileSync(join(QUATERNIUS_ARCHIVES_DIR, pack.archive))));
    for (const { path } of files) add(`${pack.name}/${path.slice(0, -'.fbx'.length)}`, 'quaternius');
  }
  for (const key of managedModelKeys(MANAGED_MODELS_DIR)) add(key, 'managed');
  if (existsSync(POLY_PIZZA_DIR)) for (const slug of readdirSync(POLY_PIZZA_DIR)) add(`poly.pizza/${slug}`, 'poly.pizza');
  return keys;
};

describe('models.json', () => {
  const keys = keysBySource();

  it.each(Object.entries(MODEL_DEFINITIONS))('%s is a valid definition of an existing model', (key, definition) => {
    expect(keys.get(key), 'no such model in any source').toBe(definition.source);
    expect(definitionProblems(definition)).toEqual([]);
  });

  it('falls back to no recolor for an unknown model or variant', () => {
    expect(recolorOf('unknown/model')).toBeUndefined();
    expect(recolorOf('roads/road-straight', 'missing')).toBeUndefined();
  });
});
