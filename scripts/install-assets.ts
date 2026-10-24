import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { MANAGED_MODELS_DIR, MODELS_DIR, QUATERNIUS_ARCHIVES_DIR, QUATERNIUS_PACKS } from './assetPacks.ts';
import { managedModelFile, managedModelKeys } from './managedModels.ts';
import { convertQuaterniusPack, type QuaterniusPack } from './quaternius.ts';

const force = process.argv.includes('--force');

async function installQuaterniusPack(pack: QuaterniusPack): Promise<void> {
  if (!force && pack.files.every((file) => existsSync(join(MODELS_DIR, pack.name, `${file}.glb`)))) return console.log(`✓ ${pack.name} already there`);
  const archive = join(QUATERNIUS_ARCHIVES_DIR, pack.archive);
  if (!existsSync(archive)) throw new Error(`${archive} is missing: restore it from git`);
  const files = await convertQuaterniusPack(new Uint8Array(readFileSync(archive)), pack);
  for (const file of files) {
    const target = join(MODELS_DIR, pack.name, file.path);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, file.data);
  }
  console.log(`✓ ${pack.name}: ${files.length} files converted from FBX`);
}

function installManagedModels(): void {
  const keys = managedModelKeys();
  for (const key of keys) {
    const source = managedModelFile(key);
    const target = join(MODELS_DIR, `${key}.glb`);
    const data = readFileSync(source);
    if (!force && existsSync(target) && readFileSync(target).equals(data)) continue;
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, data);
  }
  for (const key of keys) {
    for (const tone of ['b', 'c', 'd']) {
      const source = managedModelFile(key, `.tone-${tone}.png`);
      if (!existsSync(source)) continue;
      const target = join(MODELS_DIR, `${key}.tone-${tone}.png`);
      const data = readFileSync(source);
      if (!force && existsSync(target) && readFileSync(target).equals(data)) continue;
      writeFileSync(target, data);
    }
  }
  for (const texture of readdirSync(join(MANAGED_MODELS_DIR, 'streets', 'Textures'))) {
    const target = join(MODELS_DIR, 'streets', 'Textures', texture);
    const data = readFileSync(join(MANAGED_MODELS_DIR, 'streets', 'Textures', texture));
    if (!force && existsSync(target) && readFileSync(target).equals(data)) continue;
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, data);
  }
  console.log(`✓ managed models: ${keys.length} files`);
}

try {
  installManagedModels();
  for (const pack of QUATERNIUS_PACKS) await installQuaterniusPack(pack);
} catch (error) {
  console.error(`\nAsset install failed: ${error instanceof Error ? error.message : error}`);
  process.exit(1);
}
