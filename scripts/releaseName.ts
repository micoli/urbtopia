import { generateSeed } from '../src/core/engine/seed.ts';

const DATED_TAG = /^(\d{4}\.\d{2}\.\d{2})\.(\d{4})-(.+)$/;

export function pickReleaseName(existingNames: ReadonlySet<string>, entropy: () => number): string {
  const name = generateSeed(entropy());
  if (!existingNames.has(name)) return name;
  return pickReleaseName(existingNames, entropy);
}

export const nameOfTag = (tag: string): string => DATED_TAG.exec(tag)?.[3] ?? tag;

export function formatReleaseTag(existingTags: readonly string[], now: Date, name: string): string {
  const day = now.toISOString().slice(0, 10).replaceAll('-', '.');
  const sequences = existingTags.flatMap((tag) => {
    const match = DATED_TAG.exec(tag);
    return match?.[1] === day ? [Number(match[2])] : [];
  });
  const sequence = String(Math.max(0, ...sequences) + 1).padStart(4, '0');
  return `${day}.${sequence}-${name}`;
}
