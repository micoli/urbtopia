import type { SaveStore } from './saveStore';

export const OWNER_KEY = 'urbtopia-owner';

export interface TabOwnershipHandlers {
  onLost: () => void;
  onRegained: () => void;
}

export class TabOwnership {
  private active = false;

  constructor(
    private store: SaveStore,
    private token: string,
    private handlers: TabOwnershipHandlers,
  ) {}

  get isActive(): boolean {
    return this.active;
  }

  claim(): void {
    this.store.put(OWNER_KEY, this.token);
    this.active = true;
  }

  handleStorageChange(key: string | null): void {
    if (key !== OWNER_KEY || !this.active) return;
    if (this.store.get(OWNER_KEY) === this.token) return;
    this.active = false;
    this.handlers.onLost();
  }

  resume(): void {
    this.claim();
    this.handlers.onRegained();
  }
}
