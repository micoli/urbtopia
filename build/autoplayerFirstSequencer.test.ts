import { describe, expect, it } from 'vitest';
import type { TestSpecification } from 'vitest/node';
import { autoplayerFirst } from './autoplayerFirstSequencer.ts';

const spec = (moduleId: string) => ({ moduleId }) as TestSpecification;

describe('the order of the test files', () => {
  it('starts with the autoplayer test and keeps the order of the others', () => {
    const sorted = autoplayerFirst([spec('/repo/src/a.test.ts'), spec('/repo/src/sim/autoplayer.test.ts'), spec('/repo/src/b.test.ts')]);
    expect(sorted.map(({ moduleId }) => moduleId)).toEqual(['/repo/src/sim/autoplayer.test.ts', '/repo/src/a.test.ts', '/repo/src/b.test.ts']);
  });

  it('leaves the list alone when the autoplayer test is not in it', () => {
    expect(autoplayerFirst([spec('/repo/src/a.test.ts')]).map(({ moduleId }) => moduleId)).toEqual(['/repo/src/a.test.ts']);
  });
});
