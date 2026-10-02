export const SAVE_KEY = 'urbtopia-save';
export const BACKUP_KEY = 'urbtopia-save-backup';

export class SaveQuotaError extends Error {}

export interface SaveStore {
  get(key: string): string | null;
  put(key: string, value: string): void;
  remove(key: string): void;
}

export class LocalStorageSaveStore implements SaveStore {
  get(key: string): string | null {
    return localStorage.getItem(key);
  }

  put(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      if (error instanceof DOMException && (error.name === 'QuotaExceededError' || error.code === 22)) throw new SaveQuotaError();
      throw error;
    }
  }

  remove(key: string): void {
    localStorage.removeItem(key);
  }
}

export class MemorySaveStore implements SaveStore {
  private entries = new Map<string, string>();
  private pendingFailure: 'quota' | null = null;

  failNextPutWith(kind: 'quota'): void {
    this.pendingFailure = kind;
  }

  get(key: string): string | null {
    return this.entries.get(key) ?? null;
  }

  put(key: string, value: string): void {
    if (this.pendingFailure === 'quota') {
      this.pendingFailure = null;
      throw new SaveQuotaError();
    }
    this.entries.set(key, value);
  }

  remove(key: string): void {
    this.entries.delete(key);
  }
}
