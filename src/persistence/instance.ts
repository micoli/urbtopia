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

export const saveStore: SaveStore = createStore();
export const saveSession = new SaveSession(saveStore);
