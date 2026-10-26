import { cityNameFromSeed, MAX_CITIES, readRegistry, writeRegistry } from './cities';
import { CityScopedSaveStore } from './cityStore';
import { parseEnvelope } from './envelope';
import { writeCloudMeta } from './meta';
import { SAVE_KEY, type SaveStore } from './saveStore';

export interface CloudCityCopy {
  cityId: string;
  revision: number;
  envelope: string;
}

export type RestoreCloudCityResult = { ok: true } | { ok: false; reason: 'invalid' | 'already-here' | 'limit' };

// Brings a City found in the Cloud save onto this device as a closed City, in sync with that revision.
export function restoreCloudCity(raw: SaveStore, now: number, copy: CloudCityCopy): RestoreCloudCityResult {
  const parsed = parseEnvelope(copy.envelope);
  if (!parsed.ok) return { ok: false, reason: 'invalid' };
  const registry = readRegistry(raw);
  if (!registry) return { ok: false, reason: 'invalid' };
  if (registry.cities.some((entry) => entry.id === copy.cityId)) return { ok: false, reason: 'already-here' };
  if (registry.cities.length >= MAX_CITIES) return { ok: false, reason: 'limit' };

  const city = new CityScopedSaveStore(raw, () => copy.cityId);
  city.put(SAVE_KEY, copy.envelope);
  writeCloudMeta(city, now, { baseRevision: copy.revision, syncedSavedAt: parsed.savedAt, editedSinceSync: false, lastSyncAt: now });
  writeRegistry(raw, { ...registry, cities: [...registry.cities, { id: copy.cityId, name: cityNameFromSeed(parsed.state.seed), createdAt: now }] });
  return { ok: true };
}
