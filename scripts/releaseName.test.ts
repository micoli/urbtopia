import { describe, expect, it } from 'vitest';
import { generateSeed } from '../src/core/engine/seed';
import { formatReleaseTag, nameOfTag, pickReleaseName } from './releaseName';

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

describe('formatReleaseTag', () => {
  const now = new Date('2026-03-05T10:00:00Z');

  it('starts the day at 0001', () => {
    expect(formatReleaseTag([], now, 'calm-owl-1')).toBe('2026.03.05.0001-calm-owl-1');
  });

  it('continues after the last release of the day', () => {
    const tags = ['2026.03.05.0001-a-b-1', '2026.03.05.0002-c-d-2'];
    expect(formatReleaseTag(tags, now, 'calm-owl-1')).toBe('2026.03.05.0003-calm-owl-1');
  });

  it('ignores other days and untagged names', () => {
    const tags = ['2026.03.04.0007-a-b-1', 'slowly-hardy-jaguar-3365'];
    expect(formatReleaseTag(tags, now, 'calm-owl-1')).toBe('2026.03.05.0001-calm-owl-1');
  });
});

describe('nameOfTag', () => {
  it('strips the date and sequence prefix', () => {
    expect(nameOfTag('2026.03.05.0001-calm-owl-1')).toBe('calm-owl-1');
    expect(nameOfTag('slowly-hardy-jaguar-3365')).toBe('slowly-hardy-jaguar-3365');
  });
});
