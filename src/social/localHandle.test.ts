import { describe, expect, it } from 'vitest';
import { claimLocalHandle, handleFromEmail } from './localHandle';
import { isValidHandle } from './handle';
import { SocialError } from './types';

describe('handleFromEmail', () => {
  it('slugs the whole email', () => {
    expect(handleFromEmail('Olivier@micoli.org')).toBe('olivier-micoli-org');
    expect(handleFromEmail('a.b+c@x.io')).toBe('a-b-c-x-io');
  });

  it('cuts long slugs to 20 characters with a hash suffix', () => {
    const handle = handleFromEmail('someone.with.a.long.name@example.com');
    expect(handle.length).toBeLessThanOrEqual(20);
    expect(isValidHandle(handle)).toBe(true);
    expect(handleFromEmail('someone.with.a.long.name@example.com')).toBe(handle);
    expect(handleFromEmail('someone.with.a.long.name@example.org')).not.toBe(handle);
  });

  it('adds a numeric suffix on later attempts, within 20 characters', () => {
    expect(handleFromEmail('a@b.co', 1)).toBe('a-b-co-2');
    const handle = handleFromEmail('someone.with.a.long.name@example.com', 2);
    expect(handle.length).toBeLessThanOrEqual(20);
    expect(handle.endsWith('-3')).toBe(true);
    expect(isValidHandle(handle)).toBe(true);
  });
});

describe('claimLocalHandle', () => {
  it('sets the handle of an account that has none', async () => {
    const calls: string[] = [];
    const client = { list: async () => { throw new SocialError('handle-required'); }, setHandle: async (handle: string) => { calls.push(handle); } };
    await claimLocalHandle(client as never, 'olivier@micoli.org');
    expect(calls).toEqual(['olivier-micoli-org']);
  });

  it('keeps an existing handle', async () => {
    const calls: string[] = [];
    const client = { list: async () => ({}), setHandle: async (handle: string) => { calls.push(handle); } };
    await claimLocalHandle(client as never, 'olivier@micoli.org');
    expect(calls).toEqual([]);
  });

  it('moves to the next candidate on collision', async () => {
    const calls: string[] = [];
    const client = {
      list: async () => { throw new SocialError('handle-required'); },
      setHandle: async (handle: string) => {
        calls.push(handle);
        if (calls.length < 3) throw new SocialError('handle-taken');
      },
    };
    await claimLocalHandle(client as never, 'a@b.co');
    expect(calls).toEqual(['a-b-co', 'a-b-co-2', 'a-b-co-3']);
  });
});
