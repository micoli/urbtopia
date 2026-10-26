import { describe, expect, it } from 'vitest';
import { FakeShipmentWorld } from './fakeShipmentClient';
import { loadShipmentClient } from './loadShipmentClient';
import { parseSettlement, parseShipments } from './parseShipments';
import { toShipmentError } from './supabaseShipmentClient';

const A = '00000000-0000-0000-0000-000000000001';
const B = '00000000-0000-0000-0000-0000000000b2';
const C = '00000000-0000-0000-0000-0000000000c3';
const lot = [{ item: 'wood', quantity: 5 }];
const DAY = 86_400_000;

function world(now = { value: 0 }) {
  const shipments = new FakeShipmentWorld(() => now.value);
  for (const city of [A, B, C]) shipments.saveCity('u1', city);
  return { shipments, now, from: shipments.client('u1', A), to: shipments.client('u1', B) };
}

describe('loadShipmentClient', () => {
  it('returns null without configuration, so supabase-js is never imported', async () => {
    expect(await loadShipmentClient(A, {})).toBeNull();
  });
});

describe('toShipmentError', () => {
  it.each([
    ['urb_shipment_invalid', 'shipment-invalid'],
    ['urb_shipment_conflict', 'shipment-conflict'],
    ['urb_shipment_unavailable', 'shipment-unavailable'],
    ['urb_city_unknown', 'city-unknown'],
    ['urb_cap_shipments_waiting', 'cap-shipments-waiting'],
    ['urb_unauthenticated', 'unauthenticated'],
  ])('maps %s to %s', (marker, kind) => {
    expect(toShipmentError({ message: marker, code: 'P0001' })).toMatchObject({ kind });
  });

  it('keeps the wait of a rate limit, and tells offline from unknown', () => {
    expect(toShipmentError({ message: 'urb_rate_limited', details: '120', code: 'P0001' })).toMatchObject({ kind: 'rate-limited', retryAfterSeconds: 120 });
    expect(toShipmentError({ message: 'TypeError: Failed to fetch', code: '' })).toMatchObject({ kind: 'offline' });
    expect(toShipmentError({ message: 'boom', code: '500' })).toMatchObject({ kind: 'unknown' });
  });
});

describe('parsing', () => {
  const row = { id: 's1', fromCityId: A, toCityId: B, lot, state: 'waiting', createdAt: '2026-10-26T10:00:00Z', updatedAt: '2026-10-26T10:00:00Z' };

  it('reads the Shipments of the listing', () => {
    expect(parseShipments([row])).toEqual([{ id: 's1', fromCityId: A, toCityId: B, lot, state: 'waiting', createdAt: Date.parse(row.createdAt), updatedAt: Date.parse(row.updatedAt) }]);
  });

  it.each([[{ ...row, state: 'lost' }], [{ ...row, lot: [] }], [{ ...row, lot: [{ item: 'wood', quantity: 0 }] }], [{ ...row, createdAt: 'never' }]])('rejects a malformed row', (bad) => {
    expect(() => parseShipments([bad])).toThrow();
  });

  it('reads a claim and a cancellation, with their repeat flag', () => {
    expect(parseSettlement({ shipmentId: 's1', effect: 'receive-lot', lot, alreadyClaimed: true })).toEqual({ shipmentId: 's1', effect: 'receive-lot', lot, alreadyDone: true });
    expect(parseSettlement({ shipmentId: 's1', effect: 'return-lot', lot, alreadyCancelled: false })).toMatchObject({ effect: 'return-lot', alreadyDone: false });
    expect(() => parseSettlement({ shipmentId: 's1', effect: 'pay', lot })).toThrow();
  });
});

describe('FakeShipmentWorld', () => {
  it('sends a Shipment idempotently and refuses a changed replay', async () => {
    const { from } = world();
    await from.create('s1', B, lot);
    await from.create('s1', B, lot);
    expect(await from.list()).toHaveLength(1);
    await expect(from.create('s1', B, [{ item: 'stone', quantity: 1 }])).rejects.toMatchObject({ kind: 'shipment-conflict' });
    await expect(from.create('s1', C, lot)).rejects.toMatchObject({ kind: 'shipment-conflict' });
  });

  it('refuses a Shipment to itself, an invalid Lot and a City the account never saved', async () => {
    const { from } = world();
    await expect(from.create('s1', A, lot)).rejects.toMatchObject({ kind: 'shipment-invalid' });
    await expect(from.create('s1', B, [])).rejects.toMatchObject({ kind: 'shipment-invalid' });
    await expect(from.create('s1', 'ghost', lot)).rejects.toMatchObject({ kind: 'city-unknown' });
  });

  it('works without a Handle or an email, but not signed out', async () => {
    const { shipments } = world();
    await expect(shipments.client(null, A).create('s1', B, lot)).rejects.toMatchObject({ kind: 'unauthenticated' });
    await expect(shipments.client('u1', A).create('s1', B, lot)).resolves.toBeUndefined();
  });

  it('lets only the destination City claim, once', async () => {
    const { shipments, from, to } = world();
    await from.create('s1', B, lot);
    await expect(from.claim('s1')).rejects.toMatchObject({ kind: 'shipment-unavailable' });
    await expect(shipments.client('u1', C).claim('s1')).rejects.toMatchObject({ kind: 'shipment-unavailable' });
    await expect(shipments.client('u2', B).claim('s1')).rejects.toMatchObject({ kind: 'shipment-unavailable' });
    expect(await to.claim('s1')).toEqual({ shipmentId: 's1', effect: 'receive-lot', lot, alreadyDone: false });
    expect(await to.claim('s1')).toMatchObject({ alreadyDone: true });
    await expect(from.cancel('s1')).rejects.toMatchObject({ kind: 'shipment-unavailable' });
  });

  it('lets the sending City take the Lot back until it is claimed', async () => {
    const { from, to } = world();
    await from.create('s1', B, lot);
    await expect(to.cancel('s1')).rejects.toMatchObject({ kind: 'shipment-unavailable' });
    expect(await from.cancel('s1')).toEqual({ shipmentId: 's1', effect: 'return-lot', lot, alreadyDone: false });
    expect(await from.cancel('s1')).toMatchObject({ alreadyDone: true });
    await expect(to.claim('s1')).rejects.toMatchObject({ kind: 'shipment-unavailable' });
  });

  it('never expires a waiting Shipment, and forgets a settled one after a week', async () => {
    const { from, to, now } = world();
    await from.create('waiting', B, lot);
    await from.create('done', B, lot);
    await to.claim('done');
    now.value += 8 * DAY;
    expect((await from.list()).map(({ id }) => id)).toEqual(['waiting']);
  });

  it('allows five waiting Shipments per sending City, and frees a slot on cancellation', async () => {
    const { shipments, from } = world();
    for (let index = 0; index < 5; index += 1) await from.create(`s${index}`, B, lot);
    await expect(from.create('s5', B, lot)).rejects.toMatchObject({ kind: 'cap-shipments-waiting' });
    await expect(shipments.client('u1', B).create('other', C, lot)).resolves.toBeUndefined();
    await from.cancel('s0');
    await expect(from.create('s5', B, lot)).resolves.toBeUndefined();
  });

  it('allows thirty Shipments per account per day', async () => {
    const { shipments, from, now } = world();
    for (let index = 0; index < 30; index += 1) {
      const sender = shipments.client('u1', index % 2 === 0 ? A : C);
      await sender.create(`s${index}`, B, lot);
      await shipments.client('u1', B).claim(`s${index}`);
    }
    await expect(from.create('over', B, lot)).rejects.toMatchObject({ kind: 'rate-limited', retryAfterSeconds: 86_400 });
    now.value += DAY + 1;
    await expect(from.create('over', B, lot)).resolves.toBeUndefined();
  });

  it('reports a network failure as offline', async () => {
    const { shipments, from } = world();
    shipments.goOffline();
    await expect(from.list()).rejects.toMatchObject({ kind: 'offline' });
    shipments.goOnline();
    await expect(from.list()).resolves.toEqual([]);
  });
});
