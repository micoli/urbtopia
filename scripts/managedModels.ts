import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { MANAGED_MODELS_DIR, POLY_PIZZA_DIR } from './assetPacks.ts';

export function managedModelKeys(directory = MANAGED_MODELS_DIR, prefix = ''): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    if (entry.isDirectory()) return managedModelKeys(join(directory, entry.name), `${prefix}${entry.name}/`);
    return entry.name.endsWith('.glb') ? [`${prefix}${entry.name.slice(0, -'.glb'.length)}`] : [];
  }).sort();
}

export function polyPizzaModelKeys(directory = POLY_PIZZA_DIR): string[] {
  return readdirSync(directory, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => `poly.pizza/${entry.name}`)
    .sort();
}
