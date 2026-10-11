import { describe, expect, it } from 'vitest';
import { MATERIALS, createBuilding, dispatch, newGame, unlockCitizensOf, type Command, type ErrorKey, type GameState } from '../core';
import { FakeSocialWorld, type FakeSocialClient } from './fakeSocialClient';
import { TradeCoordinator, type TradeGame } from './tradeCoordinator';
import type { TradeOffer } from './types';

const NOW = 1_700_000_000_000;
const HOUR = 3_600_000;
const material = Object.keys(MATERIALS).find((item) => unlockCitizensOf(item as never) === 0)!;
const lot = [{ item: material, quantity: 4 }];

class TestGame implements TradeGame {
  writes = 0;
  readOnly = false;
  constructor(public current: GameState) {}
  state = () => this.current;
  apply(command: Command): ErrorKey | null {
    const result = dispatch(this.current, command, NOW);
    if (!result.ok) return result.error.key;
    this.current = result.state;
    return null;
  }
  persist() {
    this.writes += 1;
  }
  canTrade = () => !this.readOnly;
  get stock() {
    return (this.current.storage.materials as Record<string, number | undefined>)[material] ?? 0;
  }
}

function city(stock: number, urbs: number): GameState {
  const state = newGame({ seed: 'trade-orchestration', now: NOW });
  return { ...state, urbs, buildings: [createBuilding(1, 'storehouse', 55, 55, 0)], nextId: 2, storage: { materials: { [material]: stock }, goods: {} } } as GameState;
}

async function setup(seller = city(10, 100), buyer = city(0, 100)) {
  let now = NOW;
  const world = new FakeSocialWorld(() => now);
  const a = world.addPlayer('a');
  const b = world.addPlayer('b', 'b@example.com');
  await a.setHandle('Alice');
  await b.setHandle('Bob');
  await a.sendRequestByEmail('b@example.com');
  await b.acceptRequest('a');
  let counter = 0;
  const make = (client: FakeSocialClient, game: TestGame) => new TradeCoordinator({ client, game, newId: () => `offer-${(counter += 1)}` });
  const aliceGame = new TestGame(seller);
  const bobGame = new TestGame(buyer);
  const offersOf = async (client: FakeSocialClient): Promise<TradeOffer[]> => {
    const snapshot = await client.list();
    return snapshot.changed ? snapshot.offers : [];
  };
  return { world, a, b, alice: make(a, aliceGame), bob: make(b, bobGame), aliceGame, bobGame, offersOf, advance: (ms: number) => (now += ms), make, newClient: () => a };
}

describe('creating an offer', () => {
  it('reserves the Lot, writes the save, then creates the offer and confirms it', async () => {
    const { alice, aliceGame, offersOf, b } = await setup();
    const outcome = await alice.createOffer('b', lot, 50);
    expect(outcome).toEqual({ ok: true, offerId: 'offer-1' });
    expect(aliceGame.stock).toBe(6);
    expect(aliceGame.current.tradeLedger).toMatchObject([{ offerId: 'offer-1', effect: 'reserve-lot', confirmed: true, peer: 'b', urbs: 50 }]);
    expect(aliceGame.writes).toBeGreaterThanOrEqual(2);
    expect(await offersOf(b)).toMatchObject([{ id: 'offer-1', price: 50, state: 'open' }]);
  });

  it('refuses a Lot the player does not have, without calling the server', async () => {
    const { alice, aliceGame, offersOf, b } = await setup(city(2, 100));
    expect(await alice.createOffer('b', lot, 50)).toEqual({ ok: false, failure: { kind: 'game', key: 'error.missingMaterials' }, pending: false });
    expect(aliceGame.stock).toBe(2);
    expect(await offersOf(b)).toEqual([]);
  });

  it('gives the Lot back when the server refuses the offer', async () => {
    const { alice, aliceGame } = await setup();
    for (let i = 0; i < 5; i += 1) await alice.createOffer('b', [{ item: material, quantity: 1 }], 1);
    const before = aliceGame.stock;
    const outcome = await alice.createOffer('b', lot, 50);
    expect(outcome).toMatchObject({ ok: false, failure: { kind: 'social', error: 'cap-trades-open' }, pending: false });
    expect(aliceGame.stock).toBe(before);
    expect(aliceGame.current.tradeLedger).toHaveLength(5);
  });

  it('keeps the reservation and replays it when the network is down, creating the offer once', async () => {
    const { alice, aliceGame, a, offersOf, b } = await setup();
    a.goOffline();
    const outcome = await alice.createOffer('b', lot, 50);
    expect(outcome).toMatchObject({ ok: false, failure: { kind: 'social', error: 'offline' }, pending: true });
    expect(aliceGame.stock).toBe(6);
    await alice.reconcile([]);
    expect(aliceGame.current.tradeLedger[0]?.confirmed).toBe(false);
    a.goOnline();
    await alice.reconcile([]);
    await alice.reconcile([]);
    expect(aliceGame.current.tradeLedger[0]?.confirmed).toBe(true);
    expect(await offersOf(b)).toHaveLength(1);
    expect(aliceGame.stock).toBe(6);
  });

  it('recovers a reservation written to the save before a crash, with a fresh coordinator', async () => {
    const { aliceGame, make, a, offersOf, b } = await setup();
    aliceGame.apply({ type: 'TradeApply', offerId: 'crashed', effect: 'reserve-lot', lot, urbs: 30, peer: 'b' });
    expect(aliceGame.stock).toBe(6);
    const afterRestart = make(a, aliceGame);
    await afterRestart.reconcile([]);
    expect(await offersOf(b)).toMatchObject([{ id: 'crashed', price: 30 }]);
    expect(aliceGame.current.tradeLedger[0]?.confirmed).toBe(true);
    expect(aliceGame.stock).toBe(6);
  });

  it('does nothing in a read-only tab', async () => {
    const { alice, aliceGame } = await setup();
    aliceGame.readOnly = true;
    expect(await alice.createOffer('b', lot, 50)).toEqual({ ok: false, failure: { kind: 'read-only' }, pending: false });
    expect(aliceGame.stock).toBe(10);
  });
});

describe('accepting an offer', () => {
  async function opened() {
    const ctx = await setup();
    await ctx.alice.createOffer('b', lot, 50);
    const [offer] = await ctx.offersOf(ctx.b);
    return { ...ctx, offer: offer! };
  }

  it('pays the price, then asks the server, then confirms', async () => {
    const { bob, bobGame, offer, offersOf, a } = await opened();
    expect(await bob.acceptOffer(offer)).toEqual({ ok: true, offerId: offer.id });
    expect(bobGame.current.urbs).toBe(50);
    expect(bobGame.current.tradeLedger).toMatchObject([{ effect: 'pay', confirmed: true, urbs: 50 }]);
    expect((await offersOf(a))[0]).toMatchObject({ state: 'accepted' });
  });

  it('refuses without calling the server when the room, the Urbs or the Unlock are missing', async () => {
    const { offer, make, b, offersOf, a } = await opened();
    const poor = new TestGame(city(0, 10));
    expect(await make(b, poor).acceptOffer(offer)).toMatchObject({ ok: false, failure: { kind: 'game', key: 'error.notEnoughUrbs' } });
    const full = new TestGame(city(32, 100));
    expect(await make(b, full).acceptOffer(offer)).toMatchObject({ ok: false, failure: { kind: 'game', key: 'error.storageFull' } });
    expect((await offersOf(a))[0]).toMatchObject({ state: 'open' });
  });

  it('refunds the price when the offer is gone by the time the server hears of it', async () => {
    const { bob, bobGame, offer, a, offersOf } = await opened();
    await a.declineTradeOffer(offer.id);
    const outcome = await bob.acceptOffer(offer);
    expect(outcome).toMatchObject({ ok: false, failure: { kind: 'social', error: 'trade-unavailable' }, pending: false });
    expect(bobGame.current.urbs).toBe(100);
    expect(bobGame.current.tradeLedger).toEqual([]);
    expect(await offersOf(a)).toHaveLength(1);
  });

  it('confirms, and never refunds, a payment whose acceptance went through but whose answer was lost', async () => {
    const { bob, bobGame, offer, b, offersOf } = await opened();
    bobGame.apply({ type: 'TradeApply', offerId: offer.id, effect: 'pay', lot: offer.lot, urbs: offer.price, peer: offer.peerId });
    await b.acceptTradeOffer(offer.id);
    await bob.reconcile(await offersOf(b));
    expect(bobGame.current.urbs).toBe(50);
    expect(bobGame.current.tradeLedger[0]).toMatchObject({ effect: 'pay', confirmed: true });
  });

  it('refunds a pending payment for an offer that never reached the accepted state', async () => {
    const { bob, bobGame, offer, a, b, offersOf } = await opened();
    bobGame.apply({ type: 'TradeApply', offerId: offer.id, effect: 'pay', lot: offer.lot, urbs: offer.price, peer: offer.peerId });
    await a.declineTradeOffer(offer.id);
    await bob.reconcile(await offersOf(b));
    expect(bobGame.current.urbs).toBe(100);
    expect(bobGame.current.tradeLedger).toEqual([]);
  });
});

describe('claims', () => {
  async function accepted() {
    const ctx = await setup();
    await ctx.alice.createOffer('b', lot, 50);
    const [offer] = await ctx.offersOf(ctx.b);
    await ctx.bob.acceptOffer(offer!);
    return ctx;
  }

  it('moves the Lot to the buyer and the payment to the seller, once, however often it reconciles', async () => {
    const { alice, bob, aliceGame, bobGame, a, b, offersOf } = await accepted();
    for (let round = 0; round < 3; round += 1) {
      await bob.reconcile(await offersOf(b));
      await alice.reconcile(await offersOf(a));
    }
    expect(bobGame.stock).toBe(4);
    expect(bobGame.current.urbs).toBe(50);
    expect(aliceGame.stock).toBe(6);
    expect(aliceGame.current.urbs).toBe(150);
    expect(aliceGame.stock + bobGame.stock).toBe(10);
    expect(aliceGame.current.urbs + bobGame.current.urbs).toBe(200);
  });

  it('waits for room before the buyer claims the Lot, and claims once there is room', async () => {
    const { alice, bob, bobGame, aliceGame, a, b, offersOf } = await accepted();
    const roomless = bobGame.current;
    bobGame.current = { ...bobGame.current, buildings: [] };
    await bob.reconcile(await offersOf(b));
    await alice.reconcile(await offersOf(a));
    expect(bobGame.stock).toBe(0);
    expect(aliceGame.current.urbs).toBe(100);
    bobGame.current = { ...roomless, buildings: roomless.buildings };
    await bob.reconcile(await offersOf(b));
    await alice.reconcile(await offersOf(a));
    expect(bobGame.stock).toBe(4);
    expect(aliceGame.current.urbs).toBe(150);
  });

  it('credits a claim the server recorded but the save never got, exactly once', async () => {
    const { bob, bobGame, b, offersOf } = await accepted();
    const [offer] = await offersOf(b);
    await b.claimTrade(offer!.id, 'lot');
    expect(bobGame.stock).toBe(0);
    await bob.reconcile(await offersOf(b));
    await bob.reconcile(await offersOf(b));
    expect(bobGame.stock).toBe(4);
  });

  it('returns the Lot to the seller automatically when the offer is refused', async () => {
    const { alice, aliceGame, a, b, offersOf } = await setup();
    await alice.createOffer('b', lot, 50);
    const [offer] = await offersOf(b);
    await b.declineTradeOffer(offer!.id);
    expect(aliceGame.stock).toBe(6);
    await alice.reconcile(await offersOf(a));
    await alice.reconcile(await offersOf(a));
    expect(aliceGame.stock).toBe(10);
  });

  it('returns both sides what they held when the buyer never claims in time', async () => {
    const { alice, bob, aliceGame, bobGame, advance, a, b, offersOf } = await accepted();
    advance(73 * HOUR);
    await alice.reconcile(await offersOf(a));
    await bob.reconcile(await offersOf(b));
    await alice.reconcile(await offersOf(a));
    expect(aliceGame.stock).toBe(10);
    expect(aliceGame.current.urbs).toBe(100);
    expect(bobGame.stock).toBe(0);
    expect(bobGame.current.urbs).toBe(100);
  });

  it('serialises concurrent steps so nothing is credited twice', async () => {
    const { alice, bob, aliceGame, bobGame, a, b, offersOf } = await accepted();
    await Promise.all([bob.reconcile(await offersOf(b)), bob.reconcile(await offersOf(b)), bob.reconcile(await offersOf(b))]);
    await bob.reconcile(await offersOf(b));
    await Promise.all([alice.reconcile(await offersOf(a)), alice.reconcile(await offersOf(a))]);
    expect(bobGame.stock).toBe(4);
    expect(aliceGame.current.urbs).toBe(150);
  });
});
