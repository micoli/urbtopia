import { totalCitizens } from '../../core';
import { CURRENT_VERSION, parseEnvelope, type ParseOptions } from '../envelope';
import { readCloudMeta, writeCloudMeta } from '../meta';
import { SAVE_KEY, type SaveStore } from '../saveStore';
import { CloudError, type CloudAccount, type CloudSaveClient, type CloudSaveVersion } from './types';

export const PUSH_INTERVAL_MS = 5 * 60_000;
const BACKOFF_START_MS = 30_000;
const BACKOFF_MAX_MS = 10 * 60_000;

export type CloudFailure = 'newer-version' | 'invalid-cloud-save' | 'too-large' | 'unauthenticated' | 'unknown';
const FATAL_FAILURES: readonly CloudFailure[] = ['newer-version', 'invalid-cloud-save', 'too-large'];
export type SaveConflictChoice = 'local' | 'cloud';

export interface CitySummary {
  savedAt: number;
  citizens: number;
}

export interface SaveConflict {
  local: CitySummary;
  cloud: CitySummary & { revision: number };
}

export type CloudStatus =
  | { kind: 'idle' }
  | { kind: 'syncing' }
  | { kind: 'pending' }
  | { kind: 'synced'; at: number }
  | { kind: 'offline' }
  | { kind: 'error'; reason: CloudFailure }
  | { kind: 'conflict'; conflict: SaveConflict };

export interface LocalSavePort {
  adopt: (envelope: string) => void;
  keepAsPreviousVersion: () => void;
}

export interface CloudSyncDeps {
  client: CloudSaveClient;
  store: SaveStore;
  now: () => number;
  local: LocalSavePort;
  canPush: () => boolean;
  onStatus: (status: CloudStatus) => void;
  onAccount?: (account: CloudAccount | null) => void;
  parseOptions?: ParseOptions;
}

interface LocalSnapshot {
  envelope: string;
  savedAt: number;
}

export class CloudSync {
  private status: CloudStatus = { kind: 'idle' };
  private signedIn = false;
  private lastAttemptAt: number | null = null;
  private retryAt = 0;
  private failures = 0;
  private busy = false;
  private reconciled = false;
  private editCount = 0;
  private cloudCity: (CitySummary & { revision: number; envelope: string }) | null = null;

  constructor(private deps: CloudSyncDeps) {}

  get current(): CloudStatus {
    return this.status;
  }

  noteEdit(): void {
    this.editCount += 1;
    if (readCloudMeta(this.deps.store).editedSinceSync) return;
    this.updateMeta({ editedSinceSync: true });
  }

  async start(): Promise<void> {
    if (readCloudMeta(this.deps.store).paused) return;
    await this.guarded(async () => {
      await this.ensureSignedIn();
      await this.reconcile();
    });
  }

  async tick(): Promise<void> {
    if (!this.canAct()) return;
    const now = this.deps.now();
    if (now < this.retryAt) return;
    if (!this.reconciled) {
      await this.start();
      if (!this.canAct()) return;
    }
    if (!this.isDirty()) return;
    if (this.failures === 0 && this.lastAttemptAt !== null && now - this.lastAttemptAt < PUSH_INTERVAL_MS) return;
    await this.pushNow();
  }

  async pushNow(): Promise<void> {
    if (!this.canAct(true)) return;
    if (readCloudMeta(this.deps.store).paused) this.updateMeta({ paused: false });
    await this.guarded(async () => {
      await this.ensureSignedIn();
      if (!this.reconciled) await this.reconcile();
      if (this.isBlocked()) return;
      if (!this.isDirty()) return this.settle(this.readLocal());
      await this.pushLocal(false);
    });
  }

  pushOnPageHide(): void {
    if (!this.canAct() || !this.reconciled || !this.isDirty()) return;
    const local = this.readLocal();
    if (!local) return;
    const editsAtStart = this.editCount;
    this.busy = true;
    void this.deps.client
      .push({
        baseRevision: readCloudMeta(this.deps.store).baseRevision,
        envelope: local.envelope,
        savedAt: local.savedAt,
        formatVersion: CURRENT_VERSION,
        keepalive: true,
      })
      .then((revision) => this.recordSync(revision, local.savedAt, editsAtStart))
      .catch(() => {
        // The page is going away: the next session pushes again.
      })
      .finally(() => {
        this.busy = false;
      });
  }

  async resolveConflict(choice: SaveConflictChoice): Promise<void> {
    if (this.status.kind !== 'conflict' || !this.cloudCity) return;
    const cloud = this.cloudCity;
    await this.guarded(async () => {
      const local = this.readLocal();
      if (choice === 'local' && local) {
        await this.pushWith(local, cloud.revision, true);
        return;
      }
      if (local) {
        await this.deps.client.push({ baseRevision: cloud.revision, envelope: local.envelope, savedAt: local.savedAt, formatVersion: CURRENT_VERSION, keepPrevious: true });
        const restored = await this.deps.client.restore(cloud.revision);
        this.deps.local.keepAsPreviousVersion();
        this.adoptCloud({ ...cloud, revision: restored });
        return;
      }
      this.adoptCloud(cloud);
    });
  }

  async listVersions(): Promise<CloudSaveVersion[]> {
    let versions: CloudSaveVersion[] = [];
    await this.guarded(async () => {
      await this.ensureSignedIn();
      versions = await this.deps.client.list();
    });
    return versions;
  }

  async restoreVersion(revision: number): Promise<void> {
    await this.guarded(async () => {
      await this.ensureSignedIn();
      await this.deps.client.restore(revision);
      const restored = await this.deps.client.latest();
      if (!restored) return;
      this.deps.local.keepAsPreviousVersion();
      this.adoptCloud(restored);
    });
  }

  async deleteCloudData(): Promise<void> {
    await this.guarded(async () => {
      await this.ensureSignedIn();
      await this.deps.client.deleteMine();
      await this.deps.client.signOut();
      this.signedIn = false;
      this.updateMeta({ baseRevision: 0, syncedSavedAt: 0, editedSinceSync: true, lastSyncAt: null, paused: true });
      this.cloudCity = null;
      this.reconciled = false;
      this.setStatus({ kind: 'idle' });
    });
  }

  private canAct(explicit = false): boolean {
    if (this.busy || !this.deps.canPush() || this.isBlocked()) return false;
    return explicit || !readCloudMeta(this.deps.store).paused;
  }

  private isBlocked(): boolean {
    if (this.status.kind === 'conflict') return true;
    return this.status.kind === 'error' && FATAL_FAILURES.includes(this.status.reason);
  }

  private async guarded(action: () => Promise<void>): Promise<void> {
    if (this.busy || !this.deps.canPush()) return;
    this.busy = true;
    const previous = this.status;
    if (previous.kind !== 'conflict') this.setStatus({ kind: 'syncing' });
    try {
      await action();
      if (this.status.kind === 'syncing') this.setStatus(previous.kind === 'idle' ? { kind: 'idle' } : previous);
    } catch (error) {
      this.handleFailure(error);
    } finally {
      this.busy = false;
    }
  }

  private handleFailure(error: unknown): void {
    const kind = error instanceof CloudError ? error.kind : 'unknown';
    if (kind === 'too-large') return this.setStatus({ kind: 'error', reason: kind });
    if (kind === 'unauthenticated') this.signedIn = false;
    this.failures += 1;
    this.retryAt = this.deps.now() + Math.min(BACKOFF_START_MS * 2 ** (this.failures - 1), BACKOFF_MAX_MS);
    if (kind === 'offline') return this.setStatus({ kind: 'offline' });
    this.setStatus({ kind: 'error', reason: kind === 'unauthenticated' ? 'unauthenticated' : 'unknown' });
  }

  async accountChanged(): Promise<void> {
    if (!this.signedIn) return;
    this.signedIn = false;
    this.reconciled = false;
    this.cloudCity = null;
    if (this.status.kind === 'conflict') this.setStatus({ kind: 'idle' });
    await this.start();
  }

  async signOut(): Promise<void> {
    await this.guarded(async () => {
      await this.deps.client.signOut();
      this.signedIn = false;
      this.reconciled = false;
      this.cloudCity = null;
      this.deps.onAccount?.(null);
      this.setStatus({ kind: 'idle' });
    });
    await this.start();
  }

  private async ensureSignedIn(): Promise<void> {
    if (this.signedIn) return;
    await this.deps.client.signIn();
    const account = await this.deps.client.account();
    if (account) this.followAccount(account);
    this.signedIn = true;
  }

  private followAccount(account: CloudAccount): void {
    const known = readCloudMeta(this.deps.store).userId;
    if (known !== null && known !== account.userId) {
      this.updateMeta({ baseRevision: 0, syncedSavedAt: 0, editedSinceSync: true, lastSyncAt: null, paused: false });
    }
    if (known !== account.userId) this.updateMeta({ userId: account.userId });
    this.deps.onAccount?.(account);
  }

  private async reconcile(): Promise<void> {
    const cloud = await this.deps.client.latest();
    this.reconciled = true;
    this.failures = 0;
    const meta = readCloudMeta(this.deps.store);
    const local = this.readLocal();
    if (!cloud) {
      this.cloudCity = null;
      if (meta.baseRevision > 0) this.updateMeta({ baseRevision: 0, syncedSavedAt: 0, editedSinceSync: true });
      return this.settle(local);
    }
    this.cloudCity = { revision: cloud.revision, envelope: cloud.envelope, savedAt: cloud.clientSavedAt, citizens: citizensIn(cloud.envelope, this.deps.parseOptions) };
    if (cloud.revision === meta.baseRevision) return this.settle(local);
    if (!local || !meta.editedSinceSync) return this.adoptCloud(this.cloudCity);
    this.setStatus({ kind: 'conflict', conflict: { local: { savedAt: local.savedAt, citizens: citizensIn(local.envelope, this.deps.parseOptions) }, cloud: this.cloudCity } });
  }

  private settle(local: LocalSnapshot | null): void {
    if (local && this.isDirty()) return this.setStatus({ kind: 'pending' });
    this.setStatus({ kind: 'synced', at: readCloudMeta(this.deps.store).lastSyncAt ?? this.deps.now() });
  }

  private adoptCloud(cloud: { revision: number; envelope: string }): void {
    const parsed = parseEnvelope(cloud.envelope, this.deps.parseOptions);
    if (!parsed.ok) {
      return this.setStatus({ kind: 'error', reason: parsed.reason === 'newer-version' ? 'newer-version' : 'invalid-cloud-save' });
    }
    this.deps.local.adopt(cloud.envelope);
    this.updateMeta({ baseRevision: cloud.revision, syncedSavedAt: parsed.savedAt, editedSinceSync: false, lastSyncAt: this.deps.now() });
    this.setStatus({ kind: 'synced', at: this.deps.now() });
  }

  private async pushLocal(keepPrevious: boolean): Promise<void> {
    const local = this.readLocal();
    if (!local) return;
    await this.pushWith(local, readCloudMeta(this.deps.store).baseRevision, keepPrevious);
  }

  private async pushWith(local: LocalSnapshot, baseRevision: number, keepPrevious: boolean): Promise<void> {
    this.lastAttemptAt = this.deps.now();
    const editsAtStart = this.editCount;
    try {
      const revision = await this.deps.client.push({ baseRevision, envelope: local.envelope, savedAt: local.savedAt, formatVersion: CURRENT_VERSION, keepPrevious });
      this.recordSync(revision, local.savedAt, editsAtStart);
    } catch (error) {
      if (!(error instanceof CloudError) || error.kind !== 'conflict') throw error;
      await this.onPushConflict();
    }
  }

  private async onPushConflict(): Promise<void> {
    await this.reconcile();
  }

  private recordSync(revision: number, savedAt: number, editsAtStart: number): void {
    const edited = this.editCount !== editsAtStart;
    this.updateMeta({ baseRevision: revision, syncedSavedAt: savedAt, editedSinceSync: edited, lastSyncAt: this.deps.now() });
    this.failures = 0;
    this.setStatus({ kind: 'synced', at: this.deps.now() });
  }

  private isDirty(): boolean {
    const local = this.readLocal();
    return local !== null && local.savedAt > readCloudMeta(this.deps.store).syncedSavedAt;
  }

  private isEdited(): boolean {
    return readCloudMeta(this.deps.store).editedSinceSync;
  }

  private readLocal(): LocalSnapshot | null {
    const envelope = this.deps.store.get(SAVE_KEY);
    if (envelope === null) return null;
    const parsed = parseEnvelope(envelope, this.deps.parseOptions);
    return parsed.ok ? { envelope, savedAt: parsed.savedAt } : null;
  }

  private updateMeta(patch: Parameters<typeof writeCloudMeta>[2]): void {
    writeCloudMeta(this.deps.store, this.deps.now(), patch);
  }

  private setStatus(status: CloudStatus): void {
    this.status = status;
    this.deps.onStatus(status);
  }
}

function citizensIn(envelope: string, options?: ParseOptions): number {
  const parsed = parseEnvelope(envelope, options);
  return parsed.ok ? totalCitizens(parsed.state) : 0;
}
