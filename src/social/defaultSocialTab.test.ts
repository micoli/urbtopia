import { describe, expect, it } from 'vitest';
import { defaultSocialTab } from './defaultSocialTab';

describe('defaultSocialTab', () => {
  it.each([
    [{ hasEmail: false, status: 'idle' }, 'friends'],
    [{ hasEmail: true, status: 'no-handle' }, 'friends'],
    [{ hasEmail: true, status: 'ready' }, 'exchanges'],
    [{ hasEmail: true, status: 'loading' }, 'exchanges'],
    [{ hasEmail: true, status: 'offline' }, 'exchanges'],
  ] as const)('lands %j on %s', (connected, tab) => {
    expect(defaultSocialTab(connected)).toBe(tab);
  });
});
