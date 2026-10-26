import { isValidLot, type TradeLine } from '../core';
import { ShipmentError, type Shipment, type ShipmentClient, type ShipmentSettlement } from './types';

const DAY_MS = 86_400_000;
const WEEK_MS = 7 * DAY_MS;
const MAX_WAITING_PER_CITY = 5;
const MAX_PER_DAY = 30;

interface Stored extends Shipment {
  userId: string;
}

// In-memory twin of the server's Shipments: single claim, cancellation, the limits and the Cities the account saved online.
export class FakeShipmentWorld {
  private shipments: Stored[] = [];
  private cities = new Map<string, Set<string>>();
  private offline = false;

  constructor(readonly clock: () => number = () => 0) {}

  saveCity(userId: string, cityId: string): void {
    this.cities.set(userId, (this.cities.get(userId) ?? new Set()).add(cityId));
  }

  goOffline(): void {
    this.offline = true;
  }

  goOnline(): void {
    this.offline = false;
  }

  client(userId: string | null, cityId: string): ShipmentClient {
    return new FakeShipmentClient(this, userId, cityId);
  }

  guard(userId: string | null): string {
    if (this.offline) throw new ShipmentError('offline');
    if (userId === null) throw new ShipmentError('unauthenticated');
    return userId;
  }

  create(userId: string, id: string, from: string, to: string, lot: TradeLine[]): void {
    if (!id || from === to || !isValidLot(lot)) throw new ShipmentError('shipment-invalid');
    const existing = this.shipments.find((shipment) => shipment.id === id);
    if (existing) {
      const same = existing.userId === userId && existing.fromCityId === from && existing.toCityId === to && JSON.stringify(existing.lot) === JSON.stringify(lot);
      if (!same) throw new ShipmentError('shipment-conflict');
      return;
    }
    const known = this.cities.get(userId) ?? new Set<string>();
    if (!known.has(from) || !known.has(to)) throw new ShipmentError('city-unknown');
    const mine = this.shipments.filter((shipment) => shipment.userId === userId);
    if (mine.filter((shipment) => shipment.fromCityId === from && shipment.state === 'waiting').length >= MAX_WAITING_PER_CITY) throw new ShipmentError('cap-shipments-waiting');
    const now = this.clock();
    const lastDay = mine.filter((shipment) => shipment.createdAt > now - DAY_MS);
    if (lastDay.length >= MAX_PER_DAY) {
      throw new ShipmentError('rate-limited', Math.max(1, Math.ceil((Math.min(...lastDay.map((shipment) => shipment.createdAt)) + DAY_MS - now) / 1000)));
    }
    this.shipments.push({ userId, id, fromCityId: from, toCityId: to, lot: lot.map((line) => ({ ...line })), state: 'waiting', createdAt: now, updatedAt: now });
  }

  list(userId: string): Shipment[] {
    const now = this.clock();
    return this.shipments
      .filter((shipment) => shipment.userId === userId && (shipment.state === 'waiting' || shipment.updatedAt > now - WEEK_MS))
      .map(({ userId: _owner, ...shipment }) => ({ ...shipment, lot: shipment.lot.map((line) => ({ ...line })) }));
  }

  claim(userId: string, id: string, cityId: string): ShipmentSettlement {
    const shipment = this.shipments.find((candidate) => candidate.id === id);
    if (!shipment || shipment.userId !== userId || shipment.toCityId !== cityId || shipment.state === 'cancelled') throw new ShipmentError('shipment-unavailable');
    const alreadyDone = shipment.state === 'claimed';
    if (!alreadyDone) this.settle(shipment, 'claimed');
    return { shipmentId: id, effect: 'receive-lot', lot: shipment.lot.map((line) => ({ ...line })), alreadyDone };
  }

  cancel(userId: string, id: string, cityId: string): ShipmentSettlement {
    const shipment = this.shipments.find((candidate) => candidate.id === id);
    if (!shipment || shipment.userId !== userId || shipment.fromCityId !== cityId || shipment.state === 'claimed') throw new ShipmentError('shipment-unavailable');
    const alreadyDone = shipment.state === 'cancelled';
    if (!alreadyDone) this.settle(shipment, 'cancelled');
    return { shipmentId: id, effect: 'return-lot', lot: shipment.lot.map((line) => ({ ...line })), alreadyDone };
  }

  private settle(shipment: Stored, state: 'claimed' | 'cancelled'): void {
    shipment.state = state;
    shipment.updatedAt = this.clock();
  }
}

class FakeShipmentClient implements ShipmentClient {
  constructor(
    private world: FakeShipmentWorld,
    private userId: string | null,
    private cityId: string,
  ) {}

  async create(id: string, toCityId: string, lot: TradeLine[]): Promise<void> {
    this.world.create(this.world.guard(this.userId), id, this.cityId, toCityId, lot);
  }

  async list(): Promise<Shipment[]> {
    return this.world.list(this.world.guard(this.userId));
  }

  async claim(id: string): Promise<ShipmentSettlement> {
    return this.world.claim(this.world.guard(this.userId), id, this.cityId);
  }

  async cancel(id: string): Promise<ShipmentSettlement> {
    return this.world.cancel(this.world.guard(this.userId), id, this.cityId);
  }
}
