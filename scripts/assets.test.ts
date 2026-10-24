import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { MODEL_KEYS } from '../src/scene/renderItems';
import { QUATERNIUS_PACKS } from './assetPacks';
import { managedModelFile, managedModelKeys, reservedModelKeys } from './managedModels';
import { availableModelKeys } from './modelReferences';

describe('asset packs', () => {
  it('provide every 3D model the scene can ask for', () => {
    const available = availableModelKeys();
    const missing = MODEL_KEYS.filter((key) => !available.has(key));
    expect(missing).toEqual([]);
  });

  it('keep a hand-made model only when the scene uses it or it is marked reserved', () => {
    const used = new Set([...MODEL_KEYS, ...reservedModelKeys()]);
    expect(managedModelKeys().filter((key) => !used.has(key))).toEqual([]);
  });

  it('ship a palette texture for every color tone of a model', async () => {
    const { MODEL_ENTRIES } = await import('../src/core/models/modelFiles');
    const missing = Object.values(MODEL_ENTRIES).flatMap((entry) => Object.keys(entry.tones ?? {}).filter((tone) => tone !== 'a').map((tone) => managedModelFile(entry.file, `.tone-${tone}.png`))).filter((file) => !existsSync(file));
    expect(missing).toEqual([]);
  });

  it('download nothing the scene does not use', () => {
    const used = new Set(MODEL_KEYS);
    const unused = QUATERNIUS_PACKS.flatMap((pack) => pack.files.map((file) => `${pack.name}/${file}`)).filter((key) => !used.has(key));
    expect(unused).toEqual([]);
  });
});
