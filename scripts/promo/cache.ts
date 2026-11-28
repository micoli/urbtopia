import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Scene } from './types.ts';

const ENGINE_DIR = import.meta.dirname;
const ENGINE_FILES = readdirSync(ENGINE_DIR).filter((file) => file.endsWith('.ts')).sort();

// The game sources are left out on purpose: `--fresh` refilms after a visual change of the game.
// A scene that starts from the end of the previous one also depends on it: `previousHash`.
export function sceneHash(scene: Scene, root: string, previousHash?: string): string {
  const hash = createHash('sha256');
  hash.update(scene.play.toString());
  hash.update(JSON.stringify(scene.options));
  if (previousHash) hash.update(previousHash);
  if (scene.options.state && existsSync(join(root, scene.options.state))) hash.update(readFileSync(join(root, scene.options.state)));
  for (const file of ENGINE_FILES) hash.update(readFileSync(join(ENGINE_DIR, file)));
  return hash.digest('hex').slice(0, 12);
}
