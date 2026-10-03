import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ARCHIVES_DIR, ASSET_PACKS } from './assetPacks';
import { extractPack } from './extractPack';
import { PROTOTYPE_ASSETS, manifestOf } from './prototypeAssets';

const archiveOf = (name: string) => {
  const pack = ASSET_PACKS.find((candidate) => candidate.name === name);
  if (!pack) throw new Error(`Unknown pack ${name}`);
  return new Uint8Array(readFileSync(join(ARCHIVES_DIR, pack.archive)));
};

describe('prototype assets', () => {
  it.each(PROTOTYPE_ASSETS)('$prototype only asks for models that exist in the versioned archives', ({ packs }) => {
    for (const [name, selection] of Object.entries(packs)) {
      const files = extractPack(archiveOf(name), selection);
      expect(files.length, name).toBeGreaterThan(1);
    }
  });

  it('lists every model of every pack in the asset viewer manifest, sorted', () => {
    const viewer = PROTOTYPE_ASSETS.find((entry) => entry.prototype === 'asset-viewer');
    expect(viewer?.manifest).toBe(true);
    const names = Object.fromEntries(
      Object.keys(viewer?.packs ?? {}).map((pack) => [pack, extractPack(archiveOf(pack), 'all').filter((file) => file.path.endsWith('.glb')).map((file) => file.path.replace('.glb', ''))]),
    );
    const manifest = manifestOf(names);
    expect(Object.keys(manifest).sort()).toEqual(['commercial', 'industrial', 'roads', 'suburban']);
    expect(manifest.commercial).toContain('building-skyscraper-a');
    for (const list of Object.values(manifest)) expect(list).toEqual([...list].sort());
  });
});
