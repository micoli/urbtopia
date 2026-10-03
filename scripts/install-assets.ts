import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { ARCHIVES_DIR, ASSET_PACKS, MODELS_DIR, type AssetPack } from './assetPacks.ts';
import { extractPack } from './extractPack.ts';

const force = process.argv.includes('--force');

const expectedPaths = (pack: AssetPack) => [...pack.files.map((file) => `${file}.glb`), 'Textures/colormap.png'].map((file) => join(MODELS_DIR, pack.name, file));

function installPack(pack: AssetPack): void {
  if (!force && expectedPaths(pack).every(existsSync)) return console.log(`✓ ${pack.name} already there`);

  const archive = join(ARCHIVES_DIR, pack.archive);
  if (!existsSync(archive)) throw new Error(`${archive} is missing: restore it from git or run \`npm run assets:fetch\``);

  const files = extractPack(new Uint8Array(readFileSync(archive)), pack.files);
  for (const file of files) {
    const target = join(MODELS_DIR, pack.name, file.path);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, file.data);
  }
  console.log(`✓ ${pack.name}: ${files.length} files`);
}

try {
  for (const pack of ASSET_PACKS) installPack(pack);
} catch (error) {
  console.error(`\nAsset install failed: ${error instanceof Error ? error.message : error}`);
  process.exit(1);
}
