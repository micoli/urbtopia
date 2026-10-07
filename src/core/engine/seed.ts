import { nextRandom } from './random.ts';

const ADVERBS = [
  'boldly', 'brightly', 'briskly', 'calmly', 'cheerfully', 'clearly', 'cleverly', 'closely',
  'daringly', 'deftly', 'eagerly', 'easily', 'fiercely', 'fondly', 'gently', 'gladly',
  'gracefully', 'happily', 'keenly', 'kindly', 'lightly', 'loudly', 'madly', 'merrily',
  'neatly', 'nimbly', 'openly', 'politely', 'promptly', 'proudly', 'quickly', 'quietly',
  'rapidly', 'safely', 'slowly', 'smoothly', 'softly', 'steadily', 'swiftly', 'warmly',
];

const ADJECTIVES = [
  'amber', 'brisk', 'calm', 'dusty', 'eager', 'gentle', 'hazy', 'ivory',
  'jolly', 'lucky', 'mellow', 'noble', 'quiet', 'rustic', 'sunny', 'witty',
  'bright', 'clever', 'cosmic', 'crimson', 'dapper', 'dizzy', 'fuzzy', 'giddy',
  'graceful', 'hardy', 'jaunty', 'keen', 'lively', 'misty', 'nimble', 'plucky',
  'proud', 'quirky', 'radiant', 'rowdy', 'shiny', 'silent', 'snowy', 'spry',
  'stormy', 'sturdy', 'swift', 'tidy', 'velvet', 'vivid', 'wild', 'zesty',
  'bold', 'cheery', 'daring', 'fierce', 'golden', 'humble', 'lunar', 'merry',
];

const NOUNS = [
  'fox', 'owl', 'otter', 'heron', 'lynx', 'badger', 'finch', 'gecko',
  'hare', 'ibis', 'koala', 'lark', 'mole', 'newt', 'panda', 'wren',
  'alpaca', 'bison', 'camel', 'condor', 'coyote', 'crane', 'dingo', 'dolphin',
  'eagle', 'falcon', 'ferret', 'gazelle', 'gibbon', 'goose', 'hawk', 'hedgehog',
  'jackal', 'jaguar', 'kestrel', 'kiwi', 'lemur', 'llama', 'magpie', 'marmot',
  'moose', 'narwhal', 'ocelot', 'osprey', 'parrot', 'pelican', 'penguin', 'puffin',
  'quail', 'raven', 'robin', 'salamander', 'seal', 'sparrow', 'stork', 'swan',
  'tapir', 'toucan', 'turtle', 'viper', 'vole', 'walrus', 'weasel', 'yak',
  'zebra', 'bobcat',
];

function pickFrom(words: readonly string[], unitValue: number): string {
  return words[Math.floor(unitValue * words.length)] ?? '';
}

// Format: adverb-adjective-noun-NNNN (ex: gently-amber-fox-4821)
export function generateSeed(entropy: number): string {
  const first = nextRandom(entropy >>> 0);
  const second = nextRandom(first.rngState);
  const third = nextRandom(second.rngState);
  const fourth = nextRandom(third.rngState);
  const digits = 1000 + Math.floor(fourth.value * 9000);
  return `${pickFrom(ADVERBS, first.value)}-${pickFrom(ADJECTIVES, second.value)}-${pickFrom(NOUNS, third.value)}-${digits}`;
}