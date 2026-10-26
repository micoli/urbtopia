import { describe, expect, it } from 'vitest';
import { FakeSocialWorld } from './fakeSocialClient';
import { forCity } from './supabaseSocialClient';
import type { SocialClient, SocialSnapshot, TradeOffer } from './types';

const FIRST = '00000000-0000-0000-0000-000000000001';
const SECOND = '00000000-0000-0000-0000-0000000000c2';
const lot = [{ item: 'wood', quantity: 5 }];

async function friends() {
  const world = new FakeSocialWorld(() => 0);
  const alice = world.addPlayer('a', 'a@example.com');
  const bob = world.addPlayer('b', 'b@example.com');
  await alice.setHandle('Alice');
  await bob.setHandle('Bob');
  await alice.sendRequestByEmail('b@example.com');
  await bob.acceptRequest('a');
  return { world, alice, bob };
}

async function offersOf(client: SocialClient): Promise<TradeOffer[]> {
  const snapshot = await client.list();
  return snapshot.changed ? snapshot.offers : [];
}

describe('Trade offers across Cities', () => {
  it('shows a sent offer to the City it left only', async () => {
    const { world, alice } = await friends();
    await alice.createTradeOffer('o1', 'b', lot, 10);
    expect((await offersOf(alice)).map((offer) => offer.cityId)).toEqual([FIRST]);
    expect(await offersOf(world.clientInCity('a', SECOND))).toEqual([]);
  });

  it('offers an open offer to every City of the recipient, then binds it to the one that accepts', async () => {
    const { world, alice, bob } = await friends();
    await alice.createTradeOffer('o1', 'b', lot, 10);
    const bobSecond = world.clientInCity('b', SECOND);
    expect(await offersOf(bob)).toHaveLength(1);
    expect(await offersOf(bobSecond)).toHaveLength(1);

    await bobSecond.acceptTradeOffer('o1');

    expect(await offersOf(bob)).toEqual([]);
    expect(await offersOf(bobSecond)).toMatchObject([{ id: 'o1', state: 'accepted', cityId: SECOND, claimable: ['lot'] }]);
  });

  it('lets only the accepting City claim the Lot, and only the sending City the payment', async () => {
    const { world, alice, bob } = await friends();
    const bobSecond = world.clientInCity('b', SECOND);
    const aliceSecond = world.clientInCity('a', SECOND);
    await alice.createTradeOffer('o1', 'b', lot, 10);
    await bobSecond.acceptTradeOffer('o1');

    await expect(bob.claimTrade('o1', 'lot')).rejects.toMatchObject({ kind: 'trade-unavailable' });
    await expect(bobSecond.claimTrade('o1', 'lot')).resolves.toMatchObject({ effect: 'receive-lot' });
    await expect(aliceSecond.claimTrade('o1', 'payment')).rejects.toMatchObject({ kind: 'trade-unavailable' });
    await expect(alice.claimTrade('o1', 'payment')).resolves.toMatchObject({ effect: 'receive-payment', urbs: 10 });
  });

  it('returns a refused Lot to the City it left', async () => {
    const { world, alice, bob } = await friends();
    const aliceSecond = world.clientInCity('a', SECOND);
    await aliceSecond.createTradeOffer('o1', 'b', lot, 10);
    await bob.declineTradeOffer('o1');

    expect(await offersOf(alice)).toEqual([]);
    await expect(alice.claimTrade('o1', 'lot')).rejects.toMatchObject({ kind: 'trade-unavailable' });
    await expect(aliceSecond.claimTrade('o1', 'lot')).resolves.toMatchObject({ effect: 'return-lot' });
  });

  it('refuses to replay an offer from another City', async () => {
    const { world, alice } = await friends();
    await alice.createTradeOffer('o1', 'b', lot, 10);
    await expect(world.clientInCity('a', SECOND).createTradeOffer('o1', 'b', lot, 10)).rejects.toMatchObject({ kind: 'trade-conflict' });
  });
});

describe('forCity', () => {
  const offer = (id: string, cityId: string | null | undefined): TradeOffer =>
    ({ id, role: 'sender', cityId, peerId: 'b', peerHandle: 'Bob', peerAvatar: null, lot, price: 1, state: 'open', createdAt: 0, expiresAt: 1, claimDeadline: null, claimable: [], claimed: [] });
  const snapshot = { changed: true, offers: [offer('mine', FIRST), offer('theirs', SECOND), offer('open', null), offer('old', undefined)] } as unknown as SocialSnapshot;

  it('keeps the offers of the City, the not yet accepted ones and the ones without City', () => {
    const kept = forCity(snapshot, FIRST);
    expect(kept.changed && kept.offers.map(({ id }) => id)).toEqual(['mine', 'open', 'old']);
  });

  it('passes an unchanged snapshot through', () => {
    const unchanged: SocialSnapshot = { changed: false, revision: 3 };
    expect(forCity(unchanged, FIRST)).toBe(unchanged);
  });
});
