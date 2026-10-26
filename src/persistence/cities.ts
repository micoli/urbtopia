import { cityKey } from './cityStore';
import { CURRENT_VERSION, parseEnvelope } from './envelope';
import { META_KEY } from './meta';
import { BACKUP_KEY, SAVE_KEY, versionedBackupKey, type SaveStore } from './saveStore';

export const REGISTRY_KEY = 'urbtopia-cities';
export const MAX_CITIES = 3;
// The first City of every account, whatever the device: cities saved before Cities existed keep their Cloud save under this id (ADR 0047).
export const FIRST_CITY_ID = '00000000-0000-0000-0000-000000000001';

export interface CityEntry {
  id: string;
  name: string | null;
  createdAt: number;
}

export interface CityRegistry {
  lastPlayed: string;
  cities: CityEntry[];
}

export function cityNameFromSeed(seed: string): string {
  const words = seed.split('-').filter((word) => word !== '' && !/^\d+$/.test(word));
  if (words.length === 0) return seed;
  return words.map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

function isCityEntry(value: unknown): value is CityEntry {
  if (typeof value !== 'object' || value === null) return false;
  const entry = value as Partial<CityEntry>;
  return typeof entry.id === 'string' && (entry.name === null || typeof entry.name === 'string') && typeof entry.createdAt === 'number';
}

export function readRegistry(store: SaveStore): CityRegistry | null {
  const raw = store.get(REGISTRY_KEY);
  if (raw === null) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<CityRegistry>;
    if (!Array.isArray(parsed.cities) || parsed.cities.length === 0 || !parsed.cities.every(isCityEntry)) return null;
    const lastPlayed = parsed.cities.some((entry) => entry.id === parsed.lastPlayed) ? (parsed.lastPlayed as string) : (parsed.cities[0] as CityEntry).id;
    return { lastPlayed, cities: parsed.cities };
  } catch {
    return null;
  }
}

export function writeRegistry(store: SaveStore, registry: CityRegistry): void {
  store.put(REGISTRY_KEY, JSON.stringify(registry));
}

function legacyKeys(): string[] {
  const versions = Array.from({ length: CURRENT_VERSION }, (_, index) => index + 1);
  return [SAVE_KEY, BACKUP_KEY, ...versions.map(versionedBackupKey), META_KEY];
}

function legacySeed(store: SaveStore): string | null {
  const raw = store.get(SAVE_KEY);
  const parsed = raw === null ? null : parseEnvelope(raw);
  return parsed?.ok ? parsed.state.seed : null;
}

// Moves the keys of the single-save era into a City, one at a time so the data is never held twice for long; safe to run again after an interruption.
function adoptLegacyKeys(store: SaveStore, cityId: string): void {
  for (const key of legacyKeys()) {
    const value = store.get(key);
    if (value === null) continue;
    if (store.get(cityKey(key, cityId)) === null) store.put(cityKey(key, cityId), value);
    store.remove(key);
  }
}

export function bootCities(store: SaveStore, now: number): CityRegistry {
  const existing = readRegistry(store);
  if (existing) {
    const first = existing.cities[0] as CityEntry;
    adoptLegacyKeys(store, first.id);
    return existing;
  }
  const seed = legacySeed(store);
  const first: CityEntry = { id: FIRST_CITY_ID, name: seed === null ? null : cityNameFromSeed(seed), createdAt: now };
  const registry: CityRegistry = { lastPlayed: first.id, cities: [first] };
  writeRegistry(store, registry);
  adoptLegacyKeys(store, first.id);
  return registry;
}

export function nameOpenCity(store: SaveStore, seed: string): void {
  const registry = readRegistry(store);
  if (!registry) return;
  const cities = registry.cities.map((entry) => (entry.id === registry.lastPlayed && entry.name === null ? { ...entry, name: cityNameFromSeed(seed) } : entry));
  writeRegistry(store, { ...registry, cities });
}
