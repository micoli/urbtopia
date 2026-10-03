import { lstatSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { ARCHIVES_DIR, ASSET_PACKS } from './assetPacks.ts';
import { extractPack } from './extractPack.ts';
import { PROTOTYPES_DIR, PROTOTYPE_ASSETS, manifestOf } from './prototypeAssets.ts';

const isSymlink = (path: string) => {
  try {
    return lstatSync(path).isSymbolicLink();
  } catch {
    return false;
  }
};

try {
  for (const { prototype, packs, manifest } of PROTOTYPE_ASSETS) {
    const publicDir = join(PROTOTYPES_DIR, prototype, 'public');
    const modelsDir = join(publicDir, 'models');
    if (isSymlink(modelsDir)) rmSync(modelsDir);

    const names: Record<string, string[]> = {};
    for (const [packName, selection] of Object.entries(packs)) {
      const pack = ASSET_PACKS.find((candidate) => candidate.name === packName);
      if (!pack) throw new Error(`Unknown pack ${packName}`);
      const files = extractPack(new Uint8Array(readFileSync(join(ARCHIVES_DIR, pack.archive))), selection);
      for (const file of files) {
        const target = join(modelsDir, packName, file.path);
        mkdirSync(dirname(target), { recursive: true });
        writeFileSync(target, file.data);
      }
      names[packName] = files.filter((file) => file.path.endsWith('.glb')).map((file) => file.path.replace(/\.glb$/, ''));
    }
    if (manifest) writeFileSync(join(publicDir, 'manifest.json'), JSON.stringify(manifestOf(names)));
    console.log(`✓ ${prototype}: ${Object.values(names).reduce((total, list) => total + list.length, 0)} models`);
  }
} catch (error) {
  console.error(`\nPrototype asset install failed: ${error instanceof Error ? error.message : error}`);
  process.exit(1);
}
