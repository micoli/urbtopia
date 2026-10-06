import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { MANAGED_MODELS_DIR } from './assetPacks.ts';

export function managedModelKeys(directory = MANAGED_MODELS_DIR, prefix = ''): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    if (entry.isDirectory()) return managedModelKeys(join(directory, entry.name), `${prefix}${entry.name}/`);
    return entry.name.endsWith('.glb') ? [`${prefix}${entry.name.slice(0, -'.glb'.length)}`] : [];
  }).sort();
}
