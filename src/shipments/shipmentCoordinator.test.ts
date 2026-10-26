import { describe, expect, it } from 'vitest';
import { MATERIALS, createBuilding, dispatch, findLedgerEntry, newGame, shipmentLedgerId, unlockCitizensOf, type Command, type ErrorKey, type GameState } from '../core';
import { FakeShipmentWorld } from './fakeShipmentClient';
import { ShipmentCoordinator, type ShipmentGame } from './shipmentCoordinator';
import { FakeSocialWorld } from '../social/fakeSocialClient';
import { TradeCoordinator } from '../social/tradeCoordinator';
import type { ShipmentClient } from './types';

const NOW = 1_700_000_000_000;
const A = '00000000-0000-0000-0000-000000000001';
const B = '00000000-0000-0000-0000-0000000000b2';
const material = Object.keys(MATERIALS).find((item) => unlockCitizensOf(item as never) === 0)!;
const lot = [{ item: material, quantity: 4 }];

class TestGame implements ShipmentGame {
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
  canPlay = () => !this.readOnly;
  get stock() {
    return (this.current.storage.materials as Record<string, number | undefined>)[material] ?? 0;
  }
}

function city(stock: number, storehouses = 1): GameState {
  const state = newGame({ seed: 'shipment-orchestration', now: NOW });
  const buildings = Array.from({ length: storehouses }, (_, index) => createBuilding(index + 1, 'storehouse', 55 + index * 4, 55, 0));
  return { ...state, buildings, nextId: storehouses + 1, storage: { materials: { [material]: stock }, goods: {} } } as GameState;
}

function setup(sender = city(10), receiver = city(0)) {
  const world = new FakeShipmentWorld(() => NOW);
  for (const id of [A, B]) world.saveCity('u1', id);
  let counter = 0;
  const senderGame = new TestGame(sender);
  const receiverGame = new TestGame(receiver);
  const make = (client: ShipmentClient, game: TestGame) => new ShipmentCoordinator({ client, game, newId: () => `s${(counter += 1)}` });
  const senderClient = world.client('u1', A);
  const receiverClient = world.client('u1', B);
  return { world, senderGame, receiverGame, senderClient, receiverClient, sender: make(senderClient, senderGame), receiver: make(receiverClient, receiverGame), make };
}

describe('sending a Shipment', () => {
  it('debits the Lot, writes the save, then creates the Shipment and confirms it', async () => {
    const { sender, senderGame, senderClient } = setup();
    const outcome = await sender.send(B, lot);
    expect(outcome).toEqual({ ok: true, shipmentId: 's1' });
    expect(senderGame.stock).toBe(6);
    expect(findLedgerEntry(senderGame.state(), shipmentLedgerId('s1'), 'reserve-lot')?.confirmed).toBe(true);
    expect(await senderClient.list()).toHaveLength(1);
  });

  it('refuses a Lot the City does not have, and touches nothing', async () => {
    const { sender, senderGame, senderClient } = setup(city(2));
    const outcome = await sender.send(B, lot);
    expect(outcome).toMatchObject({ ok: false, failure: { kind: 'game' }, pending: false });
    expect(senderGame.stock).toBe(2);
    expect(await senderClient.list()).toEqual([]);
  });

  it('gives the Lot back when the server refuses for good', async () => {
    const { sender, senderGame } = setup();
    const outcome = await sender.send('ghost', lot);
    expect(outcome).toMatchObject({ ok: false, failure: { kind: 'shipment', error: 'city-unknown' }, pending: false });
    expect(senderGame.stock).toBe(10);
    expect(findLedgerEntry(senderGame.state(), shipmentLedgerId('s1'), 'reserve-lot')).toBeUndefined();
  });

  it('keeps the debit and replays the call after a crash between the two', async () => {
    const { sender, senderGame, senderClient, world } = setup();
    world.goOffline();
    const outcome = await sender.send(B, lot);
    expect(outcome).toMatchObject({ ok: false, failure: { error: 'offline' }, pending: true });
    expect(senderGame.stock).toBe(6);
    expect(findLedgerEntry(senderGame.state(), shipmentLedgerId('s1'), 'reserve-lot')?.confirmed).toBe(false);

    world.goOnline();
    await sender.reconcile([], A);
    expect(findLedgerEntry(senderGame.state(), shipmentLedgerId('s1'), 'reserve-lot')?.confirmed).toBe(true);
    expect(await senderClient.list()).toHaveLength(1);
    expect(senderGame.stock).toBe(6);
  });

  it('is read only while the game is', async () => {
    const { sender, senderGame } = setup();
    senderGame.readOnly = true;
    expect(await sender.send(B, lot)).toMatchObject({ ok: false, failure: { kind: 'read-only' } });
  });
});

describe('receiving a Shipment', () => {
  it('claims it when the destination City is opened, once', async () => {
    const { sender, receiver, receiverGame, receiverClient } = setup();
    await sender.send(B, lot);
    await receiver.reconcile(await receiverClient.list(), B);
    expect(receiverGame.stock).toBe(4);
    await receiver.reconcile(await receiverClient.list(), B);
    expect(receiverGame.stock).toBe(4);
    expect(findLedgerEntry(receiverGame.state(), shipmentLedgerId('s1'), 'receive-lot')?.confirmed).toBe(true);
  });

  it('credits it once even when the answer of the first claim was lost', async () => {
    const { sender, receiver, receiverGame, receiverClient, world } = setup();
    await sender.send(B, lot);
    await receiverClient.claim('s1');
    expect(receiverGame.stock).toBe(0);
    world.goOnline();
    await receiver.reconcile(await receiverClient.list(), B);
    await receiver.reconcile(await receiverClient.list(), B);
    expect(receiverGame.stock).toBe(4);
  });

  it('leaves the Shipment waiting, with a notice, while the Storehouse has no room', async () => {
    const full = { ...city(0), storage: { materials: { [material]: 0 }, goods: {} } } as GameState;
    const noRoom = { ...full, buildings: [] } as GameState;
    const { sender, receiver, receiverGame, receiverClient } = setup(city(10), noRoom);
    await sender.send(B, lot);
    const report = await receiver.reconcile(await receiverClient.list(), B);
    expect(report.waitingForRoom).toEqual(['s1']);
    expect(receiverGame.stock).toBe(0);
    expect((await receiverClient.list())[0]?.state).toBe('waiting');

    receiverGame.current = city(0);
    const later = await receiver.reconcile(await receiverClient.list(), B);
    expect(later.waitingForRoom).toEqual([]);
    expect(receiverGame.stock).toBe(4);
  });

  it('ignores Shipments for another City', async () => {
    const { sender, receiver, receiverGame, receiverClient } = setup();
    await sender.send(B, lot);
    await receiver.reconcile(await receiverClient.list(), A);
    expect(receiverGame.stock).toBe(0);
  });
});

describe('cancelling a Shipment', () => {
  it('takes the Lot back through the ledger', async () => {
    const { sender, senderGame, senderClient } = setup();
    await sender.send(B, lot);
    expect(await sender.cancel('s1')).toEqual({ ok: true, shipmentId: 's1' });
    expect(senderGame.stock).toBe(10);
    expect(findLedgerEntry(senderGame.state(), shipmentLedgerId('s1'), 'return-lot')?.confirmed).toBe(true);
    expect((await senderClient.list())[0]?.state).toBe('cancelled');
  });

  it('is refused once the Lot was claimed', async () => {
    const { sender, receiverClient, senderGame } = setup();
    await sender.send(B, lot);
    await receiverClient.claim('s1');
    expect(await sender.cancel('s1')).toMatchObject({ ok: false, failure: { kind: 'shipment', error: 'shipment-unavailable' } });
    expect(senderGame.stock).toBe(6);
  });

  it('credits the Lot once when the answer was lost, at the next reconciliation', async () => {
    const { sender, senderGame, senderClient } = setup();
    await sender.send(B, lot);
    await senderClient.cancel('s1');
    expect(senderGame.stock).toBe(6);
    await sender.reconcile(await senderClient.list(), A);
    await sender.reconcile(await senderClient.list(), A);
    expect(senderGame.stock).toBe(10);
  });
});

describe('Shipment entries in the shared ledger', () => {
  it('are left alone by the Trade coordinator, which would refuse them as offers', async () => {
    const { sender, senderGame, world } = setup();
    world.goOffline();
    await sender.send(B, lot);
    const social = new FakeSocialWorld(() => NOW);
    const trades = new TradeCoordinator({ client: social.addPlayer('a'), game: { ...senderGame, state: senderGame.state, apply: (command) => senderGame.apply(command), persist: () => senderGame.persist(), canTrade: () => true }, newId: () => 'offer' });
    await trades.reconcile([]);
    expect(senderGame.stock).toBe(6);
    expect(findLedgerEntry(senderGame.state(), shipmentLedgerId('s1'), 'reserve-lot')).toBeDefined();
  });
});
