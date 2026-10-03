import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ARCHIVES_DIR, ASSET_PACKS } from './assetPacks';
import { extractPack } from './extractPack';
import { PROTOTYPE_ASSETS, manifestOf } from './prototypeAssets';

const filesOf = (name: string, selection: string[] | 'all') => {
  const pack = ASSET_PACKS.find((candidate) => candidate.name === name);
  if (!pack) throw new Error(`Unknown pack ${name}`);
  return extractPack(new Uint8Array(readFileSync(join(ARCHIVES_DIR, pack.archive))), selection, pack.colormap);
};

describe('prototype assets', () => {
  it.each(PROTOTYPE_ASSETS)('$prototype only asks for models that exist in the versioned archives', ({ packs }) => {
    for (const [name, selection] of Object.entries(packs)) {
      const files = filesOf(name, selection);
      expect(files.length, name).toBeGreaterThan(1);
    }
  });

  it('lists every model of every pack in the asset viewer manifest, sorted', () => {
    const viewer = PROTOTYPE_ASSETS.find((entry) => entry.prototype === 'asset-viewer');
    expect(viewer?.manifest).toBe(true);
    const names = Object.fromEntries(
      Object.keys(viewer?.packs ?? {}).map((pack) => [pack, filesOf(pack, 'all').filter((file) => file.path.endsWith('.glb')).map((file) => file.path.replace('.glb', ''))]),
    );
    const manifest = manifestOf(names);
    expect(Object.keys(manifest).sort()).toEqual(ASSET_PACKS.map(({ name }) => name).sort());
    expect(manifest.commercial).toContain('building-skyscraper-a');
    for (const list of Object.values(manifest)) expect(list).toEqual([...list].sort());
  });
});
