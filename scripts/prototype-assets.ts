import { lstatSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { managedModelFile } from './managedModels.ts';
import { PROTOTYPES_DIR, PROTOTYPE_ASSETS } from './prototypeAssets.ts';

const isSymlink = (path: string) => {
  try {
    return lstatSync(path).isSymbolicLink();
  } catch {
    return false;
  }
};

try {
  for (const { prototype, managed } of PROTOTYPE_ASSETS) {
    const modelsDir = join(PROTOTYPES_DIR, prototype, 'public', 'models');
    if (isSymlink(modelsDir)) rmSync(modelsDir);

    let count = 0;
    for (const key of managed) {
      const target = join(modelsDir, `${key}.glb`);
      mkdirSync(dirname(target), { recursive: true });
      writeFileSync(target, readFileSync(managedModelFile(key)));
      count++;
    }
    console.log(`✓ ${prototype}: ${count} models`);
  }
} catch (error) {
  console.error(`\nPrototype asset install failed: ${error instanceof Error ? error.message : error}`);
  process.exit(1);
}
