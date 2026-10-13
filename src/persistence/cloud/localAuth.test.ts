import { describe, expect, it } from 'vitest';
import { isLocalSupabaseUrl, localAuthPassword, readLocalAuthEmail } from './localAuth';
import { FakeCloudSaveClient } from './fakeCloudSaveClient';
import { CloudError } from './types';

const LOCAL = 'http://127.0.0.1:54321';

describe('isLocalSupabaseUrl', () => {
  it('accepts loopback hosts only', () => {
    expect(isLocalSupabaseUrl('http://127.0.0.1:54321')).toBe(true);
    expect(isLocalSupabaseUrl('http://localhost:54321')).toBe(true);
    expect(isLocalSupabaseUrl('https://abc.supabase.co')).toBe(false);
    expect(isLocalSupabaseUrl('https://127.0.0.1.evil.com')).toBe(false);
    expect(isLocalSupabaseUrl('not a url')).toBe(false);
  });
});

describe('readLocalAuthEmail', () => {
  it('returns the normalised email in dev against a local Supabase', () => {
    expect(readLocalAuthEmail('?local-auth=Email@Toto.com', LOCAL, true)).toBe('email@toto.com');
    expect(readLocalAuthEmail('?bypass-tutorial&local-auth=a%2Bb@toto.com', LOCAL, true)).toBe('a+b@toto.com');
  });

  it('is ignored outside dev', () => {
    expect(readLocalAuthEmail('?local-auth=email@toto.com', LOCAL, false)).toBeNull();
  });

  it('is ignored against a remote Supabase', () => {
    expect(readLocalAuthEmail('?local-auth=email@toto.com', 'https://abc.supabase.co', true)).toBeNull();
  });

  it('is ignored without a plausible email', () => {
    expect(readLocalAuthEmail('', LOCAL, true)).toBeNull();
    expect(readLocalAuthEmail('?local-auth', LOCAL, true)).toBeNull();
    expect(readLocalAuthEmail('?local-auth=nope', LOCAL, true)).toBeNull();
  });
});

describe('localAuthPassword', () => {
  it('is deterministic per email', () => {
    expect(localAuthPassword('a@b.c')).toBe(localAuthPassword('a@b.c'));
    expect(localAuthPassword('a@b.c')).not.toBe(localAuthPassword('d@b.c'));
    expect(localAuthPassword('a@b.c').length).toBeGreaterThanOrEqual(6);
  });
});

describe('FakeCloudSaveClient.signInWithPassword', () => {
  it('creates the account on first use and signs back into it afterwards', async () => {
    const client = new FakeCloudSaveClient();
    await client.signInWithPassword('a@b.co', localAuthPassword('a@b.co'));
    const first = await client.account();
    expect(first?.email).toBe('a@b.co');
    await client.signInWithPassword('c@d.co', localAuthPassword('c@d.co'));
    await client.signInWithPassword('a@b.co', localAuthPassword('a@b.co'));
    expect(await client.account()).toEqual(first);
  });

  it('refuses a wrong password', async () => {
    const client = new FakeCloudSaveClient();
    await client.signInWithPassword('a@b.co', localAuthPassword('a@b.co'));
    await expect(client.signInWithPassword('a@b.co', 'other')).rejects.toBeInstanceOf(CloudError);
  });
});
