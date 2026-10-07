import { describe, expect, it } from 'vitest';
import { readCloudConfig } from './cloudConfig';
import { FakeCloudSaveClient } from './fakeCloudSaveClient';
import { loadCloudClient } from './loadCloudClient';
import { toCloudError } from './supabaseCloudSaveClient';
import { CloudError } from './types';

describe('readCloudConfig', () => {
  it('returns the URL and publishable key when both are set', () => {
    expect(readCloudConfig({ VITE_SUPABASE_URL: ' https://x.supabase.co ', VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_x' })).toEqual({
      url: 'https://x.supabase.co',
      publishableKey: 'sb_publishable_x',
    });
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
  });

  it('maps network failures to offline and anything else to unknown', () => {
    expect(toCloudError({ message: 'TypeError: Failed to fetch', code: '' })).toMatchObject({ kind: 'offline' });
    expect(toCloudError({ message: 'boom', code: '500' })).toMatchObject({ kind: 'unknown' });
  });
});

describe('FakeCloudSaveClient', () => {
  it('behaves like the database: compare-and-swap, 4 rows, size cap', async () => {
    let now = 0;
    const client = new FakeCloudSaveClient(() => now);
    for (let i = 0; i < 6; i += 1) {
      now += 2 * 3_600_000;
      await client.push({ baseRevision: i, envelope: `e${i}`, savedAt: now, formatVersion: 11 });
    }
    expect(client.rows).toHaveLength(4);
    await expect(client.push({ baseRevision: 1, envelope: 'x', savedAt: 0, formatVersion: 11 })).rejects.toMatchObject({ kind: 'conflict', serverRevision: 6 });
    await expect(client.push({ baseRevision: 6, envelope: 'x'.repeat(1_048_577), savedAt: 0, formatVersion: 11 })).rejects.toBeInstanceOf(CloudError);
  });
});
