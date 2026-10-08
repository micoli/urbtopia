import { execFileSync } from 'node:child_process';
import { randomInt } from 'node:crypto';
import { formatReleaseTag, nameOfTag, pickReleaseName } from './releaseName.ts';

const existingTags = execFileSync('git', ['tag', '--list'], { encoding: 'utf8' }).split('\n').filter(Boolean);
const name = pickReleaseName(new Set(existingTags.map(nameOfTag)), () => randomInt(2 ** 32));
console.log(formatReleaseTag(existingTags, new Date(), name));
