const FNV_OFFSET_BASIS = 2166136261;
const FNV_PRIME = 16777619;
const MULBERRY32_INCREMENT = 0x6d2b79f5;
const UINT32_RANGE = 4294967296;

// FNV-1a over the Seed characters.
export function hashSeed(seed: string): number {
  let hash = FNV_OFFSET_BASIS;
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, FNV_PRIME);
  }
  return hash >>> 0;
}

// mulberry32, with the generator state returned instead of kept in a closure so it can be serialized.
export function nextRandom(rngState: number): { value: number; rngState: number } {
  const next = (rngState + MULBERRY32_INCREMENT) >>> 0;
  let t = next;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return { value: ((t ^ (t >>> 14)) >>> 0) / UINT32_RANGE, rngState: next };
}
