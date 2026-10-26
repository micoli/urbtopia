import type { ParseFailure } from './envelope';
import { parseEnvelope, serializeEnvelope } from './envelope';
import { cityNameFromSeed, MAX_CITIES, MAX_CITY_NAME_LENGTH, readRegistry, uniqueCityName, writeRegistry } from './cities';
import { CityScopedSaveStore } from './cityStore';
import { SAVE_KEY, type SaveStore } from './saveStore';
import { readExportedCityName } from './transfer';

export type ImportCityResult = { ok: true; cityId: string } | { ok: false; reason: ParseFailure | 'limit' };

// A file always becomes a new City: no City is ever overwritten by an import.
export function importCityFile(store: SaveStore, text: string, now: number, cityId: string): ImportCityResult {
  const parsed = parseEnvelope(text);
  if (!parsed.ok) return { ok: false, reason: parsed.reason };
  const registry = readRegistry(store);
  if (!registry || registry.cities.length >= MAX_CITIES) return { ok: false, reason: 'limit' };

  const base = (readExportedCityName(text) ?? cityNameFromSeed(parsed.state.seed)).slice(0, MAX_CITY_NAME_LENGTH - 2);
  const taken = registry.cities.flatMap((entry) => (entry.name === null ? [] : [entry.name]));
  new CityScopedSaveStore(store, () => cityId).put(SAVE_KEY, serializeEnvelope(parsed.state, parsed.savedAt));
  writeRegistry(store, { ...registry, cities: [...registry.cities, { id: cityId, name: uniqueCityName(taken, base), createdAt: now }] });
  return { ok: true, cityId };
}
