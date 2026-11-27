import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { assemble } from './assemble.ts';
import { sceneHash } from './cache.ts';
import { recordScene, type Recording } from './record.ts';
import type { Scenario } from './types.ts';

const ROOT = resolve(import.meta.dirname, '../..');
const BASE_URL = process.env.PROMO_URL ?? 'http://127.0.0.1:5175';

const args = process.argv.slice(2);
const name = args.find((arg) => !arg.startsWith('--'));
const fresh = args.includes('--fresh');
const fast = args.includes('--fast');
if (fast) process.env.PROMO_FAST = '1';
const only = args.find((arg) => arg.startsWith('--scene='))?.slice('--scene='.length);

if (!name) {
  console.error('Usage: node scripts/promo/cli.ts <scenario> [--fresh] [--fast] [--scene=<name>]');
  process.exit(1);
}

const { default: loaded } = await import(`./scenarios/${name}.promo.ts`) as { default: Scenario };
const directory = join(ROOT, 'tmp/promo', name);
mkdirSync(directory, { recursive: true });

const recordings: Recording[] = [];
for (const scene of loaded.scenes) {
  if (only && scene.name !== only) continue;
  const hash = sceneHash(scene, ROOT);
  const video = join(directory, `${scene.name}.${hash}.webm`);
  if (!fast && !fresh && existsSync(video)) {
    console.log(`${scene.name}: cached`);
    recordings.push({ video, ...JSON.parse(readFileSync(`${video}.json`, 'utf8')) });
    continue;
  }
  console.log(`${scene.name}: recording`);
  recordings.push(await recordScene(scene, { baseUrl: BASE_URL, root: ROOT, directory, hash, fast }));
}

if (only || fast) process.exit(0);
const output = join(ROOT, 'tmp/promo', `${name}.mp4`);
assemble(recordings, output, directory, loaded.audio ? resolve(ROOT, loaded.audio) : undefined);
console.log(output);
