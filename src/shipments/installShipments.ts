import { cloudEnabled } from '../persistence/cloud/cloudConfig';
import { openCityId } from '../persistence/instance';
import { saveNowHandle } from '../persistence/saveNow';
import { cloudStore } from '../store/cloudStore';
import { gameStore } from '../store/gameStore';
import { createLiveGamePort } from '../store/liveGamePort';
import { liveCommandGateway } from '../store/liveCommandGateway';
import { readOnlyStore } from '../store/readOnlyStore';
import { shipmentStore } from '../store/shipmentStore';
import { createShipmentActions } from './shipmentActions';
import { ShipmentCoordinator, type ShipmentGame } from './shipmentCoordinator';
import { loadShipmentClient } from './loadShipmentClient';

const POLL_MS = 60_000;

export function installShipments(): () => void {
  if (!cloudEnabled) return () => {};

  let disposed = false;
  let stopWatching = () => {};

  void loadShipmentClient(openCityId()).then((client) => {
    if (!client || disposed) return;
    const game: ShipmentGame = {
      ...createLiveGamePort({ store: gameStore, gateway: liveCommandGateway, persist: () => saveNowHandle.current() }),
      canPlay: () => !readOnlyStore.getState().readOnly,
    };
    const coordinator = new ShipmentCoordinator({ client, game, newId: () => crypto.randomUUID() });
    const actions = createShipmentActions(client, coordinator, shipmentStore.getState(), openCityId);
    shipmentStore.getState().enable(actions);

    const refresh = () => {
      if (document.visibilityState === 'hidden' || cloudStore.getState().account === null) return;
      void actions.refresh();
    };
    const timer = setInterval(refresh, POLL_MS);
    const stopCloud = cloudStore.subscribe((store, previous) => {
      if (store.account?.userId !== previous.account?.userId) refresh();
    });
    document.addEventListener('visibilitychange', refresh);
    refresh();
    stopWatching = () => {
      clearInterval(timer);
      stopCloud();
      document.removeEventListener('visibilitychange', refresh);
    };
  });

  return () => {
    disposed = true;
    stopWatching();
  };
}
