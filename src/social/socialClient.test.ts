import { describe, expect, it } from 'vitest';
import { FakeSocialWorld } from './fakeSocialClient';
import { loadSocialClient } from './loadSocialClient';
import { parseSnapshot } from './parseSnapshot';
import { toSocialError } from './supabaseSocialClient';
import { SocialError } from './types';

describe('loadSocialClient', () => {
  it('returns null without configuration, so supabase-js is never imported', async () => {
    expect(await loadSocialClient({})).toBeNull();
  });
});

describe('toSocialError', () => {
  it.each([
    ['urb_email_required', 'email-required'],
    ['urb_handle_taken', 'handle-taken'],
    ['urb_cap_outgoing', 'cap-outgoing'],
    ['urb_not_found', 'not-found'],
  ])('maps %s to %s', (message, kind) => {
    expect(toSocialError({ message }).kind).toBe(kind);
  });

  it('carries the remaining delay of a rate limit', () => {
    const error = toSocialError({ message: 'urb_rate_limited', details: '125' });
    expect(error.kind).toBe('rate-limited');
    expect(error.retryAfterSeconds).toBe(125);
  });

  it('maps permission and network failures', () => {
    expect(toSocialError({ message: 'permission denied', code: '42501' }).kind).toBe('unauthenticated');
    expect(toSocialError({ message: 'Failed to fetch', code: '' }).kind).toBe('offline');
    expect(toSocialError({ message: 'boom', code: 'XX000' }).kind).toBe('unknown');
  });
});

describe('parseSnapshot', () => {
  const full = {
    revision: 4,
    changed: true,
    handle: 'Alice',
    findable: true,
    handleChangedAt: '2026-10-11T10:00:00Z',
    friends: [{ userId: 'b', handle: 'Bob', since: '2026-10-11T11:00:00Z' }],
    incoming: [{ userId: 'c', handle: 'Carol', at: '2026-10-11T12:00:00Z' }],
    outgoing: [],
    blocked: [{ userId: 'd', handle: 'Dave' }],
  };

  it('parses a full state', () => {
    expect(parseSnapshot(full)).toEqual({
      changed: true,
      revision: 4,
      handle: 'Alice',
      findable: true,
      handleChangedAt: Date.parse('2026-10-11T10:00:00Z'),
      friends: [{ userId: 'b', handle: 'Bob', since: Date.parse('2026-10-11T11:00:00Z') }],
      incoming: [{ userId: 'c', handle: 'Carol', at: Date.parse('2026-10-11T12:00:00Z') }],
      outgoing: [],
      blocked: [{ userId: 'd', handle: 'Dave' }],
    });
  });

  it('parses an unchanged answer', () => {
    expect(parseSnapshot({ revision: 4, changed: false })).toEqual({ changed: false, revision: 4 });
  });

  it.each([['null', null], ['no revision', { changed: false }], ['a bad list', { ...full, friends: 'x' }], ['a bad date', { ...full, handleChangedAt: 'nope' }]])(
    'rejects %s',
    (_label, json) => {
      expect(() => parseSnapshot(json)).toThrow(SocialError);
    },
  );
});

describe('FakeSocialClient', () => {
  function setup() {
    let now = 0;
    const world = new FakeSocialWorld(() => now);
    const alice = world.addPlayer('a', 'a@example.com');
    const bob = world.addPlayer('b', 'b@example.com');
    return { world, alice, bob, advance: (ms: number) => (now += ms) };
  }

  it('requires an email, then a Handle', async () => {
    const world = new FakeSocialWorld();
    const anonymous = world.addPlayer('x', null);
    await expect(anonymous.setHandle('Anon')).rejects.toMatchObject({ kind: 'email-required' });
    const member = world.addPlayer('y');
    await expect(member.list()).rejects.toMatchObject({ kind: 'handle-required' });
  });

  it('enforces the Handle rules', async () => {
    const { alice, bob, advance } = setup();
    await expect(alice.setHandle('a!')).rejects.toMatchObject({ kind: 'handle-invalid' });
    await expect(alice.setHandle('SuperAdmin')).rejects.toMatchObject({ kind: 'handle-forbidden' });
    await alice.setHandle('Alice');
    await expect(bob.setHandle('alice')).rejects.toMatchObject({ kind: 'handle-taken' });
    await expect(alice.setHandle('Alicia')).rejects.toMatchObject({ kind: 'handle-change-too-soon' });
    advance(31 * 24 * 3_600_000);
    await alice.setHandle('Alicia');
    expect((await alice.list()).changed && (await alice.list())).toMatchObject({ handle: 'Alicia' });
  });

  it('sends, accepts and lists a Friend request', async () => {
    const { alice, bob } = setup();
    await alice.setHandle('Alice');
    await bob.setHandle('Bob');
    await alice.sendRequestByEmail(' B@Example.com ');
    expect(await bob.list()).toMatchObject({ incoming: [{ userId: 'a', handle: 'Alice' }] });
    await bob.acceptRequest('a');
    expect(await alice.list()).toMatchObject({ friends: [{ userId: 'b', handle: 'Bob' }], outgoing: [] });
  });

  it('answers the same way for an unknown email and a hidden account', async () => {
    const { alice, bob } = setup();
    await alice.setHandle('Alice');
    await bob.setHandle('Bob');
    await bob.setFindable(false);
    await alice.sendRequestByEmail('nobody@example.com');
    await alice.sendRequestByEmail('b@example.com');
    expect(await alice.list()).toMatchObject({ outgoing: [] });
  });

  it('blocks silently', async () => {
    const { alice, bob } = setup();
    await alice.setHandle('Alice');
    await bob.setHandle('Bob');
    await bob.block('a');
    await alice.sendRequestByEmail('b@example.com');
    expect(await bob.list()).toMatchObject({ incoming: [], blocked: [{ userId: 'a' }] });
    expect(await alice.list()).toMatchObject({ outgoing: [], blocked: [] });
    await bob.unblock('a');
    expect(await bob.list()).toMatchObject({ blocked: [] });
  });

  it('rate limits searches and reports the remaining delay', async () => {
    const { alice } = setup();
    await alice.setHandle('Alice');
    for (let i = 0; i < 10; i += 1) await alice.sendRequestByEmail('nobody@example.com');
    await expect(alice.sendRequestByEmail('nobody@example.com')).rejects.toMatchObject({ kind: 'rate-limited', retryAfterSeconds: 3600 });
  });

  it('returns an unchanged answer for a current cursor', async () => {
    const { alice } = setup();
    await alice.setHandle('Alice');
    const snapshot = await alice.list();
    expect(await alice.list(snapshot.revision)).toEqual({ changed: false, revision: snapshot.revision });
  });

  it('fails offline', async () => {
    const { alice } = setup();
    alice.goOffline();
    await expect(alice.list()).rejects.toMatchObject({ kind: 'offline' });
  });
});
