import { nextRandom } from './random';

const ADJECTIVES = [
  'amber', 'brisk', 'calm', 'dusty', 'eager', 'gentle', 'hazy', 'ivory',
  'jolly', 'lucky', 'mellow', 'noble', 'quiet', 'rustic', 'sunny', 'witty',
];
const NOUNS = [
  'fox', 'owl', 'otter', 'heron', 'lynx', 'badger', 'finch', 'gecko',
  'hare', 'ibis', 'koala', 'lark', 'mole', 'newt', 'panda', 'wren',
];

function pickFrom(words: readonly string[], unitValue: number): string {
  return words[Math.floor(unitValue * words.length)] ?? '';
}

export function generateSeed(entropy: number): string {
  const first = nextRandom(entropy >>> 0);
  const second = nextRandom(first.rngState);
  const third = nextRandom(second.rngState);
  const digits = 1000 + Math.floor(third.value * 9000);
  return `${pickFrom(ADJECTIVES, first.value)}-${pickFrom(NOUNS, second.value)}-${digits}`;
}
