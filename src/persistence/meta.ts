import type { SaveStore } from './saveStore';

export const META_KEY = 'urbtopia-meta';
const REMINDER_DELAY_MS = 14 * 86_400_000;

export interface Meta {
  createdAt: number;
  lastExportAt: number | null;
  remindedAt: number | null;
}

export function readMeta(store: SaveStore, now: number): Meta {
  const raw = store.get(META_KEY);
  if (raw !== null) {
    try {
      const parsed = JSON.parse(raw) as Partial<Meta>;
      if (typeof parsed.createdAt === 'number') {
        return { createdAt: parsed.createdAt, lastExportAt: parsed.lastExportAt ?? null, remindedAt: parsed.remindedAt ?? null };
      }
    } catch {
      // A damaged meta record only costs a reminder date: start over below.
    }
  }
  const fresh: Meta = { createdAt: now, lastExportAt: null, remindedAt: null };
  store.put(META_KEY, JSON.stringify(fresh));
  return fresh;
}

function readRecord(store: SaveStore): Record<string, unknown> {
  const raw = store.get(META_KEY);
  if (raw === null) return {};
  try {
    const parsed: unknown = JSON.parse(raw);
    return typeof parsed === 'object' && parsed !== null ? (parsed as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

function update(store: SaveStore, now: number, patch: Partial<Meta>): void {
  store.put(META_KEY, JSON.stringify({ ...readRecord(store), ...readMeta(store, now), ...patch }));
}

export interface CloudMeta {
  baseRevision: number;
  syncedSavedAt: number;
  editedSinceSync: boolean;
  lastSyncAt: number | null;
  paused: boolean;
}

const NEVER_SYNCED: CloudMeta = { baseRevision: 0, syncedSavedAt: 0, editedSinceSync: true, lastSyncAt: null, paused: false };

export function readCloudMeta(store: SaveStore): CloudMeta {
  const raw = readRecord(store).cloud as Partial<CloudMeta> | undefined;
  if (typeof raw !== 'object' || raw === null) return { ...NEVER_SYNCED };
  return {
    baseRevision: typeof raw.baseRevision === 'number' ? raw.baseRevision : 0,
    syncedSavedAt: typeof raw.syncedSavedAt === 'number' ? raw.syncedSavedAt : 0,
    editedSinceSync: typeof raw.editedSinceSync === 'boolean' ? raw.editedSinceSync : true,
    lastSyncAt: typeof raw.lastSyncAt === 'number' ? raw.lastSyncAt : null,
    paused: raw.paused === true,
  };
}

export function writeCloudMeta(store: SaveStore, now: number, patch: Partial<CloudMeta>): void {
  update(store, now, {});
  store.put(META_KEY, JSON.stringify({ ...readRecord(store), cloud: { ...readCloudMeta(store), ...patch } }));
}

export function recordExport(store: SaveStore, now: number): void {
  update(store, now, { lastExportAt: now });
}

export function recordReminder(store: SaveStore, now: number): void {
  update(store, now, { remindedAt: now });
}

export function shouldRemindExport(input: Meta & { now: number; lastSavedAt: number }): boolean {
  const reference = Math.max(input.createdAt, input.lastExportAt ?? 0, input.remindedAt ?? 0);
  return input.now - reference > REMINDER_DELAY_MS && input.lastSavedAt > reference;
}
