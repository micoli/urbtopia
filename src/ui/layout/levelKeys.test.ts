import { describe, expect, it } from 'vitest';
import { levelStepOfKey } from './levelKeys';

const key = (value: string, modifiers = {}) => ({ key: value, ctrlKey: false, metaKey: false, altKey: false, ...modifiers });

describe('levelStepOfKey', () => {
  it('goes up with [ and deeper with ]', () => {
    expect(levelStepOfKey(key('['))).toBe(-1);
    expect(levelStepOfKey(key(']'))).toBe(1);
  });

  it('ignores other keys and shortcuts', () => {
    expect(levelStepOfKey(key('a'))).toBeNull();
    expect(levelStepOfKey(key('[', { ctrlKey: true }))).toBeNull();
    expect(levelStepOfKey(key(']', { metaKey: true }))).toBeNull();
  });
});
