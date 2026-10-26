import { createStore } from 'zustand/vanilla';
import type { TradeLine } from '../core';
import type { ShipmentFailure } from '../shipments/shipmentCoordinator';
import type { Shipment } from '../shipments/types';

export type ShipmentStatus = 'idle' | 'loading' | 'ready' | 'offline' | 'sign-in-required';

export interface ShipmentActions {
  refresh: () => Promise<void>;
  send: (toCityId: string, lot: TradeLine[]) => Promise<boolean>;
  cancel: (shipmentId: string) => Promise<boolean>;
}

export interface ShipmentStore {
  enabled: boolean;
  status: ShipmentStatus;
  shipments: Shipment[];
  waitingForRoom: string[];
  busy: boolean;
  failure: ShipmentFailure | null;
  actions: ShipmentActions | null;
  enable: (actions: ShipmentActions) => void;
  setStatus: (status: ShipmentStatus) => void;
  setShipments: (shipments: Shipment[], waitingForRoom: string[]) => void;
  setBusy: (busy: boolean) => void;
  setFailure: (failure: ShipmentFailure | null) => void;
}

export const shipmentStore = createStore<ShipmentStore>((set) => ({
  enabled: false,
  status: 'idle',
  shipments: [],
  waitingForRoom: [],
  busy: false,
  failure: null,
  actions: null,
  enable: (actions) => set({ enabled: true, actions }),
  setStatus: (status) => set({ status }),
  setShipments: (shipments, waitingForRoom) => set({ shipments, waitingForRoom }),
  setBusy: (busy) => set({ busy }),
  setFailure: (failure) => set({ failure }),
}));
