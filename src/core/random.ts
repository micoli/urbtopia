export function hashSeed(seed: string): number {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function nextRandom(rngState: number): { value: number; rngState: number } {
  const next = (rngState + 0x6d2b79f5) >>> 0;
  let t = next;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return { value: ((t ^ (t >>> 14)) >>> 0) / 4294967296, rngState: next };
}

const SEED_ADJECTIVES = ['amber', 'brisk', 'calm', 'dusty', 'eager', 'gentle', 'hazy', 'ivory', 'jolly', 'lucky', 'mellow', 'noble', 'quiet', 'rustic', 'sunny', 'witty'];
const SEED_NOUNS = ['fox', 'owl', 'otter', 'heron', 'lynx', 'badger', 'finch', 'gecko', 'hare', 'ibis', 'koala', 'lark', 'mole', 'newt', 'panda', 'wren'];

export function generateSeed(entropy: number): string {
  const first = nextRandom(entropy >>> 0);
  const second = nextRandom(first.rngState);
  const third = nextRandom(second.rngState);
  const adjective = SEED_ADJECTIVES[Math.floor(first.value * SEED_ADJECTIVES.length)];
  const noun = SEED_NOUNS[Math.floor(second.value * SEED_NOUNS.length)];
  const digits = String(1000 + Math.floor(third.value * 9000));
  return `${adjective}-${noun}-${digits}`;
}
