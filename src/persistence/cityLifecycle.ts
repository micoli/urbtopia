import type { Difficulty } from '../core';
import { importCityFile, type ImportCityResult } from './cityImport';
import { createCity, removeCity, renameCity, switchCity, type RenameResult } from './cityActions';
import { cityDeletionBlockers, type DeletionBlocker } from './cityDeletion';
import { CityScopedSaveStore } from './cityStore';
import { parseEnvelope } from './envelope';
import { SAVE_KEY, type SaveStore } from './saveStore';

const CLOUD_DELETE_PATIENCE_MS = 3000;

export interface CityLifecycleDeps {
  raw: SaveStore;
  openCityId: () => string;
  now: () => number;
  newCityId: () => string;
  tutorial: () => boolean;
  flush: () => void;
  lockSaves: () => void;
  reload: () => void;
  wait: (ms: number) => Promise<void>;
  hasWaitingShipment: (cityId: string) => boolean;
  deleteCloudCity: (cityId: string) => Promise<boolean>;
}

export type DeleteOutcome =
  | { kind: 'deleted'; cloudDeleted: Promise<boolean> }
  | { kind: 'blocked'; blockers: DeletionBlocker[] }
  | { kind: 'refused'; reason: 'last-city' | 'unknown-city' };

export interface CityLifecycle {
  open: (cityId: string) => void;
  create: (difficulty: Difficulty) => boolean;
  rename: (cityId: string, name: string) => RenameResult;
  importFile: (text: string) => ImportCityResult;
  remove: (cityId: string) => Promise<DeleteOutcome>;
}

// Switching, creating and deleting a City end in a reload: the cloud sync, the social polling and every other per-City service then start again on the right City.
export function createCityLifecycle(deps: CityLifecycleDeps): CityLifecycle {
  const blockersOf = (cityId: string): DeletionBlocker[] => {
    const saved = new CityScopedSaveStore(deps.raw, () => cityId).get(SAVE_KEY);
    const parsed = saved === null ? null : parseEnvelope(saved);
    const blockers = parsed?.ok ? cityDeletionBlockers(parsed.state) : [];
    return deps.hasWaitingShipment(cityId) && !blockers.includes('shipment') ? [...blockers, 'shipment'] : blockers;
  };

  return {
    open: (cityId) => {
      if (cityId === deps.openCityId()) return;
      deps.flush();
      if (switchCity(deps.raw, cityId)) deps.reload();
    },

    create: (difficulty) => {
      deps.flush();
      const created = createCity(deps.raw, { cityId: deps.newCityId(), now: deps.now(), difficulty, tutorial: deps.tutorial() });
      if (!created.ok) return false;
      switchCity(deps.raw, created.cityId);
      deps.reload();
      return true;
    },

    rename: (cityId, name) => renameCity(deps.raw, cityId, name),

    importFile: (text) => {
      deps.flush();
      const imported = importCityFile(deps.raw, text, deps.now(), deps.newCityId());
      if (!imported.ok) return imported;
      switchCity(deps.raw, imported.cityId);
      deps.reload();
      return imported;
    },

    remove: async (cityId) => {
      deps.flush();
      const blockers = blockersOf(cityId);
      if (blockers.length > 0) return { kind: 'blocked', blockers };
      const isOpen = cityId === deps.openCityId();
      const removed = removeCity(deps.raw, cityId);
      if (!removed.ok) return { kind: 'refused', reason: removed.reason };
      if (isOpen) deps.lockSaves();
      const cloudDeleted = deps.deleteCloudCity(cityId).catch(() => false);
      if (isOpen) {
        await Promise.race([cloudDeleted, deps.wait(CLOUD_DELETE_PATIENCE_MS)]);
        deps.reload();
      }
      return { kind: 'deleted', cloudDeleted };
    },
  };
}
