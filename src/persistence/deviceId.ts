import type { SaveStore } from './saveStore';

export const DEVICE_ID_KEY = 'urbtopia-device-id';

export function readDeviceId(store: SaveStore, newId: () => string): string {
  const known = store.get(DEVICE_ID_KEY);
  if (known !== null && known !== '') return known;
  const fresh = newId();
  store.put(DEVICE_ID_KEY, fresh);
  return fresh;
}
