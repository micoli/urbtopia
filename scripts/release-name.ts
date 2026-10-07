import { execFileSync } from 'node:child_process';
import { randomInt } from 'node:crypto';
import { pickReleaseName } from './releaseName.ts';

const existingTags = execFileSync('git', ['tag', '--list'], { encoding: 'utf8' }).split('\n').filter(Boolean);
console.log(pickReleaseName(new Set(existingTags), () => randomInt(2 ** 32)));
