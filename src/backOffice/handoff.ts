export const BACK_OFFICE_ORIGINS = ['http://localhost:5180', 'http://127.0.0.1:5180'];
export const READY_MESSAGE = 'urbix-back-office:ready';
export const SAVE_MESSAGE = 'urbix-back-office:save';

export interface BackOfficeSave {
  handle: string | null;
  revision: number;
  envelope: string;
}

export function isBackOfficeSessionRequested(search: string, dev: boolean): boolean {
  return dev && new URLSearchParams(search).has('from-back-office');
}

export function readSaveMessage(origin: string, data: unknown): BackOfficeSave | null {
  if (!BACK_OFFICE_ORIGINS.includes(origin)) return null;
  if (typeof data !== 'object' || data === null) return null;
  const { type, handle, revision, envelope } = data as Record<string, unknown>;
  if (type !== SAVE_MESSAGE) return null;
  if (typeof envelope !== 'string' || !Number.isInteger(revision)) return null;
  return { handle: typeof handle === 'string' ? handle : null, revision: revision as number, envelope };
}
