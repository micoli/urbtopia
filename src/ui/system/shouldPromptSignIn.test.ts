import { describe, expect, it } from 'vitest';
import { shouldPromptSignIn, SIGN_IN_PROMPT_CITIZENS, SIGN_IN_PROMPT_SNOOZE_MS } from './shouldPromptSignIn';

const base = {
  citizens: SIGN_IN_PROMPT_CITIZENS,
  cloudEnabled: true,
  account: { userId: 'u', email: null },
  status: { kind: 'synced', at: 0 } as const,
  cloudPaused: false,
  enabled: true,
  dismissed: false,
  dismissedAt: null,
  now: 1_000_000_000_000,
};

describe('shouldPromptSignIn', () => {
  it('prompts an anonymous player from the citizen threshold', () => {
    expect(shouldPromptSignIn(base)).toBe(true);
  });

  it('does not prompt when the player chose never or the e2e mode keeps it away', () => {
    expect(shouldPromptSignIn({ ...base, enabled: false })).toBe(false);
  });

  it('waits for the threshold', () => {
    expect(shouldPromptSignIn({ ...base, citizens: SIGN_IN_PROMPT_CITIZENS - 1 })).toBe(false);
  });

  it('does not prompt a signed-in player', () => {
    expect(shouldPromptSignIn({ ...base, account: { userId: 'u', email: 'a@b.c' } })).toBe(false);
  });

  it('does not prompt when the cloud is unavailable or the prompt was dismissed', () => {
    expect(shouldPromptSignIn({ ...base, cloudEnabled: false })).toBe(false);
    expect(shouldPromptSignIn({ ...base, dismissed: true })).toBe(false);
  });

  it('stays quiet for 12 hours after being dismissed, then prompts again', () => {
    const dismissedAt = base.now - SIGN_IN_PROMPT_SNOOZE_MS + 1;
    expect(shouldPromptSignIn({ ...base, dismissedAt })).toBe(false);
    expect(shouldPromptSignIn({ ...base, dismissedAt: base.now - SIGN_IN_PROMPT_SNOOZE_MS })).toBe(true);
  });

  it('waits for the account while connecting, but not when sync is paused', () => {
    expect(shouldPromptSignIn({ ...base, account: null, status: { kind: 'idle' } })).toBe(false);
    expect(shouldPromptSignIn({ ...base, account: null, status: { kind: 'idle' }, cloudPaused: true })).toBe(true);
  });

  it('leaves the save conflict dialog alone', () => {
    const conflict = { kind: 'conflict', conflict: { local: { savedAt: 0, citizens: 1 }, cloud: { savedAt: 0, citizens: 1, revision: 1 } } } as const;
    expect(shouldPromptSignIn({ ...base, status: conflict })).toBe(false);
  });
});
