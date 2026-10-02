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

function update(store: SaveStore, now: number, patch: Partial<Meta>): void {
  store.put(META_KEY, JSON.stringify({ ...readMeta(store, now), ...patch }));
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
