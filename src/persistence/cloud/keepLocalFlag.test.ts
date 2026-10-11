import { describe, expect, it } from 'vitest';
import { isKeepLocalRequested } from './keepLocalFlag';

describe('isKeepLocalRequested', () => {
  it('is on when the keep-local parameter is present', () => {
    expect(isKeepLocalRequested('?keep-local')).toBe(true);
    expect(isKeepLocalRequested('?bypass-tutorial&keep-local=1')).toBe(true);
  });

  it('is off otherwise', () => {
    expect(isKeepLocalRequested('')).toBe(false);
    expect(isKeepLocalRequested('?bypass-tutorial')).toBe(false);
  });
});
