import { describe, expect, it } from 'vitest';
import { generateSeed } from '../src/core/engine/seed';
import { pickReleaseName } from './releaseName';

describe('pickReleaseName', () => {
  it('returns the generated name when it is free', () => {
    expect(pickReleaseName(new Set(), () => 7)).toBe(generateSeed(7));
  });

  it('draws again while the name already exists', () => {
    const taken = new Set([generateSeed(1), generateSeed(2)]);
    const entropies = [1, 2, 3];
    expect(pickReleaseName(taken, () => entropies.shift() ?? 0)).toBe(generateSeed(3));
  });
});
