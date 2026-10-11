import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { AVATAR_IDS } from '../src/social/avatar';

const avatarDir = join('dist', 'avatars');
const PNG_SIGNATURE = '89504e470d0a1a0a';
const SIZE = 128;

describe.skipIf(!existsSync(avatarDir))('Avatar images in the build', () => {
  it.each(AVATAR_IDS)('has a %s portrait of the expected size', id => {
    const file = join(avatarDir, `${id}.png`);
    expect(existsSync(file)).toBe(true);
    const png = readFileSync(file);
    expect(png.subarray(0, 8).toString('hex')).toBe(PNG_SIGNATURE);
    expect(png.readUInt32BE(16)).toBe(SIZE);
    expect(png.readUInt32BE(20)).toBe(SIZE);
    expect(png.length).toBeGreaterThan(1000);
  });
});
