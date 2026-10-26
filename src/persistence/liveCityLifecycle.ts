import { isBypassTutorialRequested } from '../store/bypassTutorialFlag';
import { cloudStore } from '../store/cloudStore';
import { shipmentStore } from '../store/shipmentStore';
import { createCityLifecycle } from './cityLifecycle';
import { openCityId, rawSaveStore, saveSession } from './instance';
import { saveNowHandle } from './saveNow';

export const liveCityLifecycle = createCityLifecycle({
  raw: rawSaveStore,
  openCityId,
  now: Date.now,
  newCityId: () => crypto.randomUUID(),
  tutorial: () => !isBypassTutorialRequested(window.location.search),
  flush: () => saveNowHandle.current(),
  lockSaves: () => saveSession.lock(),
  reload: () => window.location.reload(),
  wait: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  hasWaitingShipment: (cityId) => shipmentStore.getState().shipments.some((shipment) => shipment.state === 'waiting' && (shipment.fromCityId === cityId || shipment.toCityId === cityId)),
  deleteCloudCity: async (cityId) => (await cloudStore.getState().actions?.deleteCity(cityId)) ?? true,
});
