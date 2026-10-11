import { describe, expect, it } from 'vitest';
import { FakeSocialWorld } from './fakeSocialClient';
import { loadSocialClient } from './loadSocialClient';
import { parseSnapshot, parseTradeClaim } from './parseSnapshot';
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
    ['urb_message_invalid', 'message-invalid'],
    ['urb_not_friends', 'not-friends'],
    ['urb_trade_invalid', 'trade-invalid'],
    ['urb_trade_conflict', 'trade-conflict'],
    ['urb_trade_unavailable', 'trade-unavailable'],
    ['urb_cap_trades_open', 'cap-trades-open'],
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
    avatar: 'character-male-a',
    findable: true,
    handleChangedAt: '2026-10-11T10:00:00Z',
    friends: [{ userId: 'b', handle: 'Bob', since: '2026-10-11T11:00:00Z', unread: 2, lastMessageAt: '2026-10-11T11:30:00Z' }],
    incoming: [{ userId: 'c', handle: 'Carol', at: '2026-10-11T12:00:00Z' }],
    outgoing: [],
    blocked: [{ userId: 'd', handle: 'Dave' }],
  };

  it('parses a full state', () => {
    expect(parseSnapshot(full)).toEqual({
      changed: true,
      revision: 4,
      handle: 'Alice',
      avatar: 'character-male-a',
      findable: true,
      handleChangedAt: Date.parse('2026-10-11T10:00:00Z'),
      friends: [{ userId: 'b', handle: 'Bob', avatar: null, since: Date.parse('2026-10-11T11:00:00Z'), unread: 2, lastMessageAt: Date.parse('2026-10-11T11:30:00Z') }],
      incoming: [{ userId: 'c', handle: 'Carol', avatar: null, at: Date.parse('2026-10-11T12:00:00Z') }],
      outgoing: [],
      blocked: [{ userId: 'd', handle: 'Dave', avatar: null }],
      offers: [],
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

  it('shares an Avatar with Friends and rejects unknown ones', async () => {
    const { alice, bob } = setup();
    await alice.setHandle('Alice');
    await bob.setHandle('Bob');
    await alice.sendRequestByEmail('b@example.com');
    await bob.acceptRequest('a');
    const before = await bob.list();
    await expect(alice.setAvatar('character-unknown')).rejects.toMatchObject({ kind: 'avatar-invalid' });
    await alice.setAvatar('character-female-c');
    expect(await alice.list()).toMatchObject({ avatar: 'character-female-c' });
    expect(await bob.list(before.revision)).toMatchObject({ changed: true, friends: [{ userId: 'a', avatar: 'character-female-c' }] });
    await alice.setAvatar(null);
    expect(await alice.list()).toMatchObject({ avatar: null });
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

describe('FakeSocialClient messages', () => {
  async function friends() {
    let now = 0;
    const world = new FakeSocialWorld(() => now);
    const alice = world.addPlayer('a');
    const bob = world.addPlayer('b', 'b@example.com');
    const carol = world.addPlayer('c', 'c@example.com');
    await alice.setHandle('Alice');
    await bob.setHandle('Bob');
    await carol.setHandle('Carol');
    await alice.sendRequestByEmail('b@example.com');
    await bob.acceptRequest('a');
    return { alice, bob, carol, advance: (ms: number) => (now += ms) };
  }

  it('delivers a trimmed message and counts it as unread until it is read', async () => {
    const { alice, bob } = await friends();
    await alice.sendMessage('b', '  Hello  ');
    expect(await bob.list()).toMatchObject({ friends: [{ handle: 'Alice', unread: 1, lastMessageAt: 0 }] });
    expect(await bob.listMessages('a')).toMatchObject([{ body: 'Hello', fromMe: false }]);
    expect(await bob.list()).toMatchObject({ friends: [{ unread: 0 }] });
    expect(await alice.listMessages('b')).toMatchObject([{ body: 'Hello', fromMe: true }]);
  });

  it('only returns the messages after the given id', async () => {
    const { alice, bob } = await friends();
    const first = await alice.sendMessage('b', 'one');
    await alice.sendMessage('b', 'two');
    expect(await bob.listMessages('a', first)).toMatchObject([{ body: 'two' }]);
  });

  it('refuses invalid messages and non Friends', async () => {
    const { alice, carol } = await friends();
    await expect(alice.sendMessage('b', '   ')).rejects.toMatchObject({ kind: 'message-invalid' });
    await expect(alice.sendMessage('b', 'x'.repeat(501))).rejects.toMatchObject({ kind: 'message-invalid' });
    await expect(alice.sendMessage('c', 'hi')).rejects.toMatchObject({ kind: 'not-friends' });
    await expect(carol.listMessages('a')).rejects.toMatchObject({ kind: 'not-friends' });
  });

  it('rate limits to 30 messages a minute and reports the delay', async () => {
    const { alice } = await friends();
    for (let i = 0; i < 30; i += 1) await alice.sendMessage('b', `m${i}`);
    await expect(alice.sendMessage('b', 'too many')).rejects.toMatchObject({ kind: 'rate-limited', retryAfterSeconds: 60 });
  });

  it('ends the Conversation with the Friendship or a Block', async () => {
    const { alice, bob } = await friends();
    await alice.sendMessage('b', 'hi');
    await bob.block('a');
    await expect(alice.listMessages('b')).rejects.toMatchObject({ kind: 'not-friends' });
    await bob.unblock('a');
    await alice.sendRequestByEmail('b@example.com');
    await bob.acceptRequest('a');
    expect(await alice.listMessages('b')).toEqual([]);
  });
});

describe('trade offers parsing', () => {
  const offer = {
    id: 'o1', role: 'recipient', peerId: 'a', peerHandle: 'Alice', lot: [{ item: 'wood', quantity: 3 }], price: 40, state: 'accepted',
    createdAt: '2026-10-11T10:00:00Z', expiresAt: '2026-10-14T10:00:00Z', claimDeadline: '2026-10-14T11:00:00Z', claimable: ['lot'], claimed: [],
  };
  const full = { revision: 1, changed: true, handle: 'Bob', findable: true, handleChangedAt: '2026-10-11T10:00:00Z', friends: [], incoming: [], outgoing: [], blocked: [], offers: [offer] };

  it('parses the offers of the social state, and defaults to none', () => {
    const parsed = parseSnapshot(full);
    expect(parsed).toMatchObject({ offers: [{ id: 'o1', role: 'recipient', peerHandle: 'Alice', price: 40, state: 'accepted', claimable: ['lot'], claimed: [], lot: [{ item: 'wood', quantity: 3 }] }] });
    expect(parseSnapshot({ ...full, offers: undefined })).toMatchObject({ offers: [] });
  });

  it.each([
    ['an unknown state', { ...offer, state: 'weird' }],
    ['an unknown role', { ...offer, role: 'bystander' }],
    ['an empty lot', { ...offer, lot: [] }],
    ['a bad slot', { ...offer, claimable: ['key'] }],
    ['a missing price', { ...offer, price: undefined }],
  ])('rejects %s', (_label, bad) => {
    expect(() => parseSnapshot({ ...full, offers: [bad] })).toThrow(SocialError);
  });

  it('parses a claim of a Lot and of a payment', () => {
    expect(parseTradeClaim({ offerId: 'o1', slot: 'lot', effect: 'receive-lot', alreadyClaimed: false, lot: [{ item: 'wood', quantity: 3 }], urbs: null })).toEqual({
      offerId: 'o1', slot: 'lot', effect: 'receive-lot', alreadyClaimed: false, lot: [{ item: 'wood', quantity: 3 }],
    });
    expect(parseTradeClaim({ offerId: 'o1', slot: 'payment', effect: 'receive-payment', alreadyClaimed: true, lot: null, urbs: 40 })).toEqual({
      offerId: 'o1', slot: 'payment', effect: 'receive-payment', alreadyClaimed: true, urbs: 40,
    });
    expect(() => parseTradeClaim({ offerId: 'o1', slot: 'lot', effect: 'teleport', alreadyClaimed: false })).toThrow(SocialError);
  });
});

describe('FakeSocialClient trade offers', () => {
  const HOUR = 3_600_000;
  const lot = [{ item: 'wood', quantity: 5 }];

  async function friends() {
    let now = 0;
    const world = new FakeSocialWorld(() => now);
    const alice = world.addPlayer('a');
    const bob = world.addPlayer('b', 'b@example.com');
    const carol = world.addPlayer('c', 'c@example.com');
    await alice.setHandle('Alice');
    await bob.setHandle('Bob');
    await carol.setHandle('Carol');
    await alice.sendRequestByEmail('b@example.com');
    await bob.acceptRequest('a');
    return { alice, bob, carol, advance: (ms: number) => (now += ms) };
  }

  const offersOf = async (client: { list(): Promise<unknown> }) => ((await client.list()) as { offers: { id: string; state: string; claimable: string[]; claimed: string[] }[] }).offers;

  it('creates an offer idempotently and shows it to both sides, by Handle', async () => {
    const { alice, bob } = await friends();
    await alice.createTradeOffer('o1', 'b', lot, 50);
    await alice.createTradeOffer('o1', 'b', lot, 50);
    expect(await offersOf(alice)).toHaveLength(1);
    expect(await bob.list()).toMatchObject({ offers: [{ id: 'o1', role: 'recipient', peerHandle: 'Alice', price: 50, state: 'open' }] });
    await expect(alice.createTradeOffer('o1', 'b', lot, 60)).rejects.toMatchObject({ kind: 'trade-conflict' });
  });

  it('refuses invalid offers and non Friends', async () => {
    const { alice } = await friends();
    await expect(alice.createTradeOffer('o1', 'b', [], 5)).rejects.toMatchObject({ kind: 'trade-invalid' });
    await expect(alice.createTradeOffer('o1', 'b', lot, 10_001)).rejects.toMatchObject({ kind: 'trade-invalid' });
    await expect(alice.createTradeOffer('o1', 'a', lot, 5)).rejects.toMatchObject({ kind: 'trade-invalid' });
    await expect(alice.createTradeOffer('o1', 'c', lot, 5)).rejects.toMatchObject({ kind: 'not-friends' });
  });

  it('limits open offers to 5 and offers per day to 30', async () => {
    const { alice, bob, advance } = await friends();
    for (let i = 0; i < 5; i += 1) await alice.createTradeOffer(`o${i}`, 'b', lot, 1);
    await expect(alice.createTradeOffer('o5', 'b', lot, 1)).rejects.toMatchObject({ kind: 'cap-trades-open' });
    for (let i = 0; i < 5; i += 1) await bob.declineTradeOffer(`o${i}`);
    for (let i = 5; i < 30; i += 1) {
      await alice.createTradeOffer(`o${i}`, 'b', lot, 1);
      await bob.declineTradeOffer(`o${i}`);
    }
    await expect(alice.createTradeOffer('o30', 'b', lot, 1)).rejects.toMatchObject({ kind: 'rate-limited' });
    advance(25 * HOUR);
    await alice.createTradeOffer('o30', 'b', lot, 1);
  });

  it('settles a trade: the Lot goes to the recipient, then the payment to the sender, once each', async () => {
    const { alice, bob } = await friends();
    await alice.createTradeOffer('o1', 'b', lot, 50);
    await expect(alice.acceptTradeOffer('o1')).rejects.toMatchObject({ kind: 'trade-unavailable' });
    await bob.acceptTradeOffer('o1');
    await bob.acceptTradeOffer('o1');
    await expect(alice.claimTrade('o1', 'payment')).rejects.toMatchObject({ kind: 'trade-unavailable' });
    expect((await offersOf(bob))[0]).toMatchObject({ claimable: ['lot'] });
    expect(await bob.claimTrade('o1', 'lot')).toEqual({ offerId: 'o1', slot: 'lot', effect: 'receive-lot', alreadyClaimed: false, lot });
    expect(await bob.claimTrade('o1', 'lot')).toMatchObject({ alreadyClaimed: true, lot });
    expect((await offersOf(alice))[0]).toMatchObject({ claimable: ['payment'] });
    expect(await alice.claimTrade('o1', 'payment')).toEqual({ offerId: 'o1', slot: 'payment', effect: 'receive-payment', alreadyClaimed: false, urbs: 50 });
    expect(await alice.claimTrade('o1', 'payment')).toMatchObject({ alreadyClaimed: true });
    expect((await offersOf(alice))[0]).toMatchObject({ claimable: [], claimed: ['payment'] });
    expect((await offersOf(bob))[0]).toMatchObject({ claimable: [], claimed: ['lot'] });
  });

  it('returns the Lot to the sender when the offer is refused or cancelled', async () => {
    const { alice, bob } = await friends();
    await alice.createTradeOffer('o1', 'b', lot, 5);
    await alice.createTradeOffer('o2', 'b', lot, 5);
    await bob.declineTradeOffer('o1');
    await alice.declineTradeOffer('o2');
    await expect(bob.claimTrade('o1', 'lot')).rejects.toMatchObject({ kind: 'trade-unavailable' });
    expect(await alice.claimTrade('o1', 'lot')).toMatchObject({ effect: 'return-lot', lot });
    expect(await alice.claimTrade('o2', 'lot')).toMatchObject({ effect: 'return-lot' });
  });

  it('expires an open offer after 72 hours and lapses an accepted one whose Lot is not claimed', async () => {
    const { alice, bob, advance } = await friends();
    await alice.createTradeOffer('o1', 'b', lot, 5);
    await alice.createTradeOffer('o2', 'b', lot, 80);
    await bob.acceptTradeOffer('o2');
    advance(73 * HOUR);
    expect((await offersOf(alice)).map((offer) => [offer.id, offer.state, offer.claimable])).toEqual(expect.arrayContaining([['o1', 'expired', ['lot']], ['o2', 'lapsed', ['lot']]]));
    expect(await alice.claimTrade('o1', 'lot')).toMatchObject({ effect: 'return-lot' });
    expect(await alice.claimTrade('o2', 'lot')).toMatchObject({ effect: 'return-lot' });
    await expect(alice.claimTrade('o2', 'payment')).rejects.toMatchObject({ kind: 'trade-unavailable' });
    expect(await bob.claimTrade('o2', 'payment')).toMatchObject({ effect: 'return-payment', urbs: 80 });
  });

  it('closes the offers between two players when they stop being Friends or one blocks the other', async () => {
    const { alice, bob } = await friends();
    await alice.createTradeOffer('o1', 'b', lot, 5);
    await alice.createTradeOffer('o2', 'b', lot, 5);
    await bob.acceptTradeOffer('o2');
    await bob.block('a');
    expect((await offersOf(alice)).map((offer) => [offer.id, offer.state])).toEqual(expect.arrayContaining([['o1', 'cancelled'], ['o2', 'lapsed']]));
    expect(await alice.claimTrade('o1', 'lot')).toMatchObject({ effect: 'return-lot' });
  });
});
