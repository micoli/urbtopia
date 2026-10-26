import { bootCities } from './cities';
import { CityScopedSaveStore } from './cityStore';
import { LocalStorageSaveStore, MemorySaveStore, type SaveStore } from './saveStore';
import { SaveSession } from './saveSession';

function createStore(): SaveStore {
  try {
    localStorage.setItem('urbtopia-probe', '1');
    localStorage.removeItem('urbtopia-probe');
    return new LocalStorageSaveStore();
  } catch {
    return new MemorySaveStore();
  }
}

export const rawSaveStore: SaveStore = createStore();
const openId = bootCities(rawSaveStore, Date.now()).lastPlayed;

export function openCityId(): string {
  return openId;
}

export const saveStore: SaveStore = new CityScopedSaveStore(rawSaveStore, openCityId);
export const saveSession = new SaveSession(saveStore);
