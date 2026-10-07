import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ARCHIVES_DIR, ASSET_PACKS } from './assetPacks';
import { extractPack } from './extractPack';
import { PROTOTYPE_ASSETS } from './prototypeAssets';

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
});
