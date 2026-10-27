import { describe, expect, it } from 'vitest';
import { isE2eRequested } from './e2eFlag';

describe('isE2eRequested', () => {
  it('is on when the e2e parameter is present', () => {
    expect(isE2eRequested('?e2e')).toBe(true);
    expect(isE2eRequested('?fps&e2e=1')).toBe(true);
  });

  it('is off otherwise', () => {
    expect(isE2eRequested('')).toBe(false);
    expect(isE2eRequested('?e2e-extra')).toBe(false);
  });
});
