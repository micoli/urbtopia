import { existsSync, readdirSync } from 'node:fs';
import { basename, join } from 'node:path';
import { MANAGED_MODELS_DIR } from './assetPacks.ts';

// A managed model lives in its own folder: <theme>/<name>/<name>.glb, next to its .blend, recipe and tone textures.
export function managedModelFile(key: string, suffix = '.glb', directory = MANAGED_MODELS_DIR): string {
  return join(directory, key, `${basename(key)}${suffix}`);
}

export function managedModelKeys(directory = MANAGED_MODELS_DIR, prefix = ''): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    if (!entry.isDirectory()) return [];
    if (existsSync(join(directory, entry.name, `${entry.name}.glb`))) return [`${prefix}${entry.name}`];
    return managedModelKeys(join(directory, entry.name), `${prefix}${entry.name}/`);
  }).sort();
}

export function reservedModelKeys(directory = MANAGED_MODELS_DIR): string[] {
  return managedModelKeys(directory).filter(key => existsSync(managedModelFile(key, '.reserved', directory)));
}
