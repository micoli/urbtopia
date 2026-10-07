import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { ARCHIVES_DIR, ASSET_PACKS, MANAGED_MODELS_DIR, MODELS_DIR, POLY_PIZZA_DIR, QUATERNIUS_ARCHIVES_DIR, QUATERNIUS_PACKS, type AssetPack } from './assetPacks.ts';
import { managedModelKeys, polyPizzaModelKeys } from './managedModels.ts';
import { readBuildings } from './buildingsFile.ts';
import { convertQuaterniusPack, type QuaterniusPack } from './quaternius.ts';
import { extractPack } from './extractPack.ts';

const force = process.argv.includes('--force');

const expectedPaths = (pack: AssetPack) => [...pack.files.map((file) => `${file}.glb`), ...(pack.colormap === false ? [] : ['Textures/colormap.png']), ...(pack.colorVariants ? ['Textures/variation-a.png', 'Textures/variation-b.png', 'Textures/variation-c.png'] : [])].map((file) => join(MODELS_DIR, pack.name, file));

function installPack(pack: AssetPack): void {
  if (pack.files.length === 0) return;
  if (!force && expectedPaths(pack).every(existsSync)) return console.log(`✓ ${pack.name} already there`);

  const archive = join(ARCHIVES_DIR, pack.archive);
  if (!existsSync(archive)) throw new Error(`${archive} is missing: restore it from git or run \`npm run assets:fetch\``);

  const files = extractPack(new Uint8Array(readFileSync(archive)), pack.files, pack.colormap, pack.colorVariants);
  for (const file of files) {
    const target = join(MODELS_DIR, pack.name, file.path);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, file.data);
  }
  console.log(`✓ ${pack.name}: ${files.length} files`);
}

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
    const source = join(MANAGED_MODELS_DIR, `${key}.glb`);
    const target = join(MODELS_DIR, `${key}.glb`);
    const data = readFileSync(source);
    if (!force && existsSync(target) && readFileSync(target).equals(data)) continue;
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, data);
  }
  console.log(`✓ managed models: ${keys.length} files`);
}

function installPolyPizzaModels(): void {
  const sceneModels = readFileSync('src/scene/renderItems.ts', 'utf8');
  const buildingModels = new Set(Object.values(readBuildings()).map(({ model }) => model));
  const keys = polyPizzaModelKeys().filter(key => buildingModels.has(key) || sceneModels.includes(`'${key}'`));
  for (const key of keys) {
    const slug = key.slice('poly.pizza/'.length);
    const data = readFileSync(join(POLY_PIZZA_DIR, slug, `${slug}.glb`));
    const target = join(MODELS_DIR, `${key}.glb`);
    if (!force && existsSync(target) && readFileSync(target).equals(data)) continue;
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, data);
  }
  console.log(`✓ poly.pizza models: ${keys.length} files`);
}

try {
  installManagedModels();
  installPolyPizzaModels();
  for (const pack of ASSET_PACKS) installPack(pack);
  for (const pack of QUATERNIUS_PACKS) await installQuaterniusPack(pack);
} catch (error) {
  console.error(`\nAsset install failed: ${error instanceof Error ? error.message : error}`);
  process.exit(1);
}
