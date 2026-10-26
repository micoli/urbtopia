import { newGame, type Difficulty } from '../core';
import { cityKey, CityScopedSaveStore } from './cityStore';
import { cityKeys, cityNameFromSeed, cityNameProblem, MAX_CITIES, readRegistry, uniqueCityName, writeRegistry, type CityNameProblem } from './cities';
import { serializeEnvelope } from './envelope';
import { SAVE_KEY, type SaveStore } from './saveStore';

export type RenameResult = { ok: true } | { ok: false; reason: CityNameProblem };
export type CreateResult = { ok: true; cityId: string } | { ok: false; reason: 'limit' };
export type RemoveResult = { ok: true } | { ok: false; reason: 'last-city' | 'unknown-city' };

export function renameCity(store: SaveStore, cityId: string, name: string): RenameResult {
  const registry = readRegistry(store);
  if (!registry) return { ok: false, reason: 'empty' };
  const problem = cityNameProblem(registry, cityId, name);
  if (problem) return { ok: false, reason: problem };
  writeRegistry(store, { ...registry, cities: registry.cities.map((entry) => (entry.id === cityId ? { ...entry, name: name.trim() } : entry)) });
  return { ok: true };
}

export interface NewCityParams {
  cityId: string;
  now: number;
  difficulty: Difficulty;
  tutorial: boolean;
}

// The new City is written as a saved game so the next boot opens it like any other City.
export function createCity(store: SaveStore, { cityId, now, difficulty, tutorial }: NewCityParams): CreateResult {
  const registry = readRegistry(store);
  if (!registry || registry.cities.length >= MAX_CITIES) return { ok: false, reason: 'limit' };
  const state = newGame({ now, tutorial, venueTutorials: tutorial, difficulty });
  const taken = registry.cities.flatMap((entry) => (entry.name === null ? [] : [entry.name]));
  new CityScopedSaveStore(store, () => cityId).put(SAVE_KEY, serializeEnvelope(state, now));
  writeRegistry(store, { ...registry, cities: [...registry.cities, { id: cityId, name: uniqueCityName(taken, cityNameFromSeed(state.seed)), createdAt: now }] });
  return { ok: true, cityId };
}

export function switchCity(store: SaveStore, cityId: string): boolean {
  const registry = readRegistry(store);
  if (!registry?.cities.some((entry) => entry.id === cityId)) return false;
  writeRegistry(store, { ...registry, lastPlayed: cityId });
  return true;
}

export function removeCity(store: SaveStore, cityId: string): RemoveResult {
  const registry = readRegistry(store);
  if (!registry?.cities.some((entry) => entry.id === cityId)) return { ok: false, reason: 'unknown-city' };
  if (registry.cities.length === 1) return { ok: false, reason: 'last-city' };
  const cities = registry.cities.filter((entry) => entry.id !== cityId);
  const lastPlayed = registry.lastPlayed === cityId ? (cities[0]?.id ?? registry.lastPlayed) : registry.lastPlayed;
  writeRegistry(store, { lastPlayed, cities });
  for (const key of cityKeys()) store.remove(cityKey(key, cityId));
  return { ok: true };
}
