import { META_KEY } from './meta';
import { BACKUP_KEY, SAVE_KEY, type SaveStore } from './saveStore';

function isCityKey(key: string): boolean {
  return key === SAVE_KEY || key === META_KEY || key.startsWith(BACKUP_KEY);
}

export function cityKey(key: string, cityId: string): string {
  return `${key}:${cityId}`;
}

// The save, backups and meta of the open City live under keys suffixed by its id; every other key is shared by all Cities (ADR 0047).
export class CityScopedSaveStore implements SaveStore {
  constructor(
    private raw: SaveStore,
    private openCityId: () => string,
  ) {}

  get(key: string): string | null {
    return this.raw.get(this.physical(key));
  }

  put(key: string, value: string): void {
    this.raw.put(this.physical(key), value);
  }

  remove(key: string): void {
    this.raw.remove(this.physical(key));
  }

  private physical(key: string): string {
    return isCityKey(key) ? cityKey(key, this.openCityId()) : key;
  }
}
