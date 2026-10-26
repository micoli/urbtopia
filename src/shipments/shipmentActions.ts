import type { TradeLine } from '../core';
import type { ShipmentActions, ShipmentStore } from '../store/shipmentStore';
import type { ShipmentCoordinator } from './shipmentCoordinator';
import { ShipmentError, type ShipmentClient } from './types';

type Setters = Pick<ShipmentStore, 'setStatus' | 'setShipments' | 'setBusy' | 'setFailure'>;

export function createShipmentActions(client: ShipmentClient, coordinator: ShipmentCoordinator, store: Setters, openCityId: () => string): ShipmentActions {
  const refresh = async (): Promise<void> => {
    try {
      const shipments = await client.list();
      const report = await coordinator.reconcile(shipments, openCityId());
      store.setShipments(await client.list(), report.waitingForRoom);
      store.setStatus('ready');
    } catch (error) {
      const kind = error instanceof ShipmentError ? error.kind : 'unknown';
      store.setStatus(kind === 'unauthenticated' ? 'sign-in-required' : 'offline');
    }
  };

  const run = async (step: () => ReturnType<ShipmentCoordinator['send']>): Promise<boolean> => {
    store.setBusy(true);
    store.setFailure(null);
    try {
      const outcome = await step();
      if (!outcome.ok) store.setFailure(outcome.failure);
      await refresh();
      return outcome.ok;
    } finally {
      store.setBusy(false);
    }
  };

  return {
    refresh,
    send: (toCityId: string, lot: TradeLine[]) => run(() => coordinator.send(toCityId, lot)),
    cancel: (shipmentId: string) => run(() => coordinator.cancel(shipmentId)),
  };
}
