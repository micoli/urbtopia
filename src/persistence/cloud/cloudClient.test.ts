import { describe, expect, it } from 'vitest';
import { FIRST_CITY_ID } from '../cities';
import { readCloudConfig } from './cloudConfig';
import { FakeCloudSaveClient } from './fakeCloudSaveClient';
import { isPlausibleEmail } from './email';
import { loadCloudClient } from './loadCloudClient';
import { isEmailTaken, toCloudError } from './supabaseCloudSaveClient';
import { CloudError } from './types';


describe('readCloudConfig', () => {
  it('returns the URL and publishable key when both are set', () => {
    expect(readCloudConfig({ VITE_SUPABASE_URL: ' https://x.supabase.co ', VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_x' })).toEqual({
      url: 'https://x.supabase.co',
      publishableKey: 'sb_publishable_x',
    });
  });

  it.each([
    ['https://x.supabase.co/'],
    ['https://x.supabase.co/rest/v1/'],
    ['https://x.supabase.co/auth/v1'],
  ])('keeps only the project root of %s', (url) => {
    expect(readCloudConfig({ VITE_SUPABASE_URL: url, VITE_SUPABASE_PUBLISHABLE_KEY: 'k' })?.url).toBe('https://x.supabase.co');
  });

  it.each([
    ['nothing', {}],
    ['an empty URL', { VITE_SUPABASE_URL: '', VITE_SUPABASE_PUBLISHABLE_KEY: 'k' }],
    ['a missing key', { VITE_SUPABASE_URL: 'https://x.supabase.co' }],
    ['a blank key', { VITE_SUPABASE_URL: 'https://x.supabase.co', VITE_SUPABASE_PUBLISHABLE_KEY: '  ' }],
  ])('disables the cloud with %s', (_label, env) => {
    expect(readCloudConfig(env)).toBeNull();
  });
});

describe('loadCloudClient', () => {
  it('returns null without configuration, so supabase-js is never imported', async () => {
    expect(await loadCloudClient({})).toBeNull();
  });
});

describe('toCloudError', () => {
  it('maps the urb_ database errors to typed errors', () => {
    expect(toCloudError({ message: 'urb_conflict', details: '7' })).toMatchObject({ kind: 'conflict', serverRevision: 7 });
    expect(toCloudError({ message: 'urb_too_large' })).toMatchObject({ kind: 'too-large' });
    expect(toCloudError({ message: 'urb_unauthenticated' })).toMatchObject({ kind: 'unauthenticated' });
    expect(toCloudError({ message: 'permission denied', code: '42501' })).toMatchObject({ kind: 'unauthenticated' });
    expect(toCloudError({ message: 'email rate limit exceeded', code: 'over_email_send_rate_limit' })).toMatchObject({ kind: 'rate-limited' });
  });

  it('maps a wrong or expired one-time code to invalid-code', () => {
    expect(toCloudError({ message: 'Token has expired or is invalid', code: 'otp_expired' })).toMatchObject({ kind: 'invalid-code' });
    expect(toCloudError({ message: 'Token has expired or is invalid' })).toMatchObject({ kind: 'invalid-code' });
  });

  it('maps the City limit to its own error', () => {
    expect(toCloudError({ message: 'urb_city_limit', code: '54000' })).toMatchObject({ kind: 'city-limit' });
  });

  it('maps network failures to offline and anything else to unknown', () => {
    expect(toCloudError({ message: 'TypeError: Failed to fetch', code: '' })).toMatchObject({ kind: 'offline' });
    expect(toCloudError({ message: 'boom', code: '500' })).toMatchObject({ kind: 'unknown' });
  });
});

describe('FakeCloudSaveClient', () => {
  it('behaves like the database: compare-and-swap, 10 rows, size cap', async () => {
    let now = 0;
    const client = new FakeCloudSaveClient(() => now);
    for (let i = 0; i < 12; i += 1) {
      now += 2 * 3_600_000;
      await client.push({ cityId: FIRST_CITY_ID, baseRevision: i, envelope: `e${i}`, savedAt: now, formatVersion: 11 });
    }
    expect(client.rows).toHaveLength(10);
    await expect(client.push({ cityId: FIRST_CITY_ID, baseRevision: 1, envelope: 'x', savedAt: 0, formatVersion: 11 })).rejects.toMatchObject({ kind: 'conflict', serverRevision: 12 });
    await expect(client.push({ cityId: FIRST_CITY_ID, baseRevision: 12, envelope: 'x'.repeat(1_048_577), savedAt: 0, formatVersion: 11 })).rejects.toBeInstanceOf(CloudError);
  });
});

describe('isPlausibleEmail', () => {
  it('accepts an address and rejects obvious mistakes', () => {
    expect(isPlausibleEmail(' me@example.com ')).toBe(true);
    for (const bad of ['', 'me', 'me@', '@example.com', 'me@example', 'me @example.com']) expect(isPlausibleEmail(bad)).toBe(false);
  });
});

describe('isEmailTaken', () => {
  it('recognises an already used email by code or by message', () => {
    expect(isEmailTaken({ message: 'x', code: 'email_exists' })).toBe(true);
    expect(isEmailTaken({ message: 'A user with this email address has already been registered' })).toBe(true);
    expect(isEmailTaken({ message: 'Unable to validate email address: invalid format', code: 'validation_failed' })).toBe(false);
  });
});

describe('email code with the fake client', () => {
  it('records the address a code was sent to and accepts only the right code', async () => {
    const client = new FakeCloudSaveClient();
    await client.signIn();
    await client.sendEmailCode('me@example.com');
    expect(client.sentCodes).toEqual(['me@example.com']);
    await expect(client.verifyEmailCode('me@example.com', '000000')).rejects.toMatchObject({ kind: 'invalid-code' });
    expect(await client.account()).toMatchObject({ email: null });
    await client.verifyEmailCode('me@example.com', ' 123456 ');
    expect(await client.account()).toMatchObject({ email: 'me@example.com' });
  });
});
