import { describe, expect, it } from 'vitest';
import { isSignInPromptAllowed } from './signInPromptFlag';

describe('isSignInPromptAllowed', () => {
  it('is allowed outside the e2e mode', () => {
    expect(isSignInPromptAllowed('')).toBe(true);
    expect(isSignInPromptAllowed('?fps')).toBe(true);
  });

  it('is kept away by the e2e mode', () => {
    expect(isSignInPromptAllowed('?e2e')).toBe(false);
    expect(isSignInPromptAllowed('?e2e&bypass-tutorial')).toBe(false);
  });

  it('is brought back by an explicit parameter, with or without the e2e mode', () => {
    expect(isSignInPromptAllowed('?e2e&sign-in-prompt')).toBe(true);
    expect(isSignInPromptAllowed('?sign-in-prompt')).toBe(true);
  });
});
