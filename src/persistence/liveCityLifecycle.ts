import { isBypassTutorialRequested } from '../store/bypassTutorialFlag';
import { cloudStore } from '../store/cloudStore';
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
  deleteCloudCity: async (cityId) => (await cloudStore.getState().actions?.deleteCity(cityId)) ?? true,
});
