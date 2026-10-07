import { generateSeed } from '../src/core/engine/seed.ts';

export function pickReleaseName(existingNames: ReadonlySet<string>, entropy: () => number): string {
  const name = generateSeed(entropy());
  if (!existingNames.has(name)) return name;
  return pickReleaseName(existingNames, entropy);
}
