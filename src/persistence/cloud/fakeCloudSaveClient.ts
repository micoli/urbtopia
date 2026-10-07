import { CloudError, type CloudAccount, type CloudSave, type CloudSaveClient, type CloudSaveVersion, type PushInput } from './types';

const MAX_ROWS = 4;
const MAX_ENVELOPE_LENGTH = 1_048_576;

interface Row extends CloudSave {
  createdAt: number;
}

export class FakeCloudSaveClient implements CloudSaveClient {
  private users = new Map<string, Row[]>();
  private userId = 'user-1';
  private nextUser = 2;
  emails = new Map<string, string>();
  sentLinks: string[] = [];
  private listeners = new Set<(account: CloudAccount | null) => void>();
  pushes: PushInput[] = [];
  signedIn = false;
  private offline = false;
  private hourMs = 3_600_000;

  constructor(private clock: () => number = () => 0) {}

  get rows(): Row[] {
    let rows = this.users.get(this.userId);
    if (!rows) {
      rows = [];
      this.users.set(this.userId, rows);
    }
    return rows;
  }

  set rows(value: Row[]) {
    this.users.set(this.userId, value);
  }

  switchUser(userId: string, email: string | null = null): void {
    this.userId = userId;
    if (email) this.emails.set(userId, email);
    this.emitAccount();
  }

  goOffline(): void {
    this.offline = true;
  }

  goOnline(): void {
    this.offline = false;
  }

  seed(envelope: string, savedAt: number): number {
    return this.insert(envelope, savedAt, 0);
  }

  async signIn(): Promise<void> {
    this.guard();
    this.signedIn = true;
  }

  async signOut(): Promise<void> {
    this.signedIn = false;
    this.userId = `user-${this.nextUser}`;
    this.nextUser += 1;
    this.emitAccount();
  }

  async account(): Promise<CloudAccount | null> {
    this.guard();
    return this.signedIn ? { userId: this.userId, email: this.emails.get(this.userId) ?? null } : null;
  }

  async sendEmailLink(email: string): Promise<void> {
    this.guard();
    this.sentLinks.push(email);
  }

  onAccountChange(listener: (account: CloudAccount | null) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emitAccount(): void {
    const account = { userId: this.userId, email: this.emails.get(this.userId) ?? null };
    for (const listener of this.listeners) listener(account);
  }

  async push(input: PushInput): Promise<number> {
    this.guard();
    this.pushes.push(input);
    if (input.envelope.length > MAX_ENVELOPE_LENGTH) throw new CloudError('too-large');
    const current = this.current();
    const currentRevision = current?.revision ?? 0;
    if (input.baseRevision !== currentRevision) throw new CloudError('conflict', currentRevision);
    const sameHour = current && this.clock() - current.createdAt < this.hourMs;
    if (current && sameHour && !input.keepPrevious) {
      current.revision += 1;
      current.envelope = input.envelope;
      current.clientSavedAt = input.savedAt;
      return current.revision;
    }
    return this.insert(input.envelope, input.savedAt, currentRevision);
  }

  async latest(): Promise<CloudSave | null> {
    this.guard();
    const current = this.current();
    return current ? { revision: current.revision, envelope: current.envelope, clientSavedAt: current.clientSavedAt } : null;
  }

  async list(): Promise<CloudSaveVersion[]> {
    this.guard();
    return [...this.rows].reverse().map((row) => ({ revision: row.revision, clientSavedAt: row.clientSavedAt, createdAt: row.createdAt }));
  }

  async restore(revision: number): Promise<number> {
    this.guard();
    const source = this.rows.find((row) => row.revision === revision);
    if (!source) throw new CloudError('unknown');
    return this.insert(source.envelope, source.clientSavedAt, this.current()?.revision ?? 0);
  }

  async deleteMine(): Promise<void> {
    this.guard();
    this.rows = [];
  }

  private current(): Row | undefined {
    return this.rows[this.rows.length - 1];
  }

  private insert(envelope: string, savedAt: number, previousRevision: number): number {
    const revision = previousRevision + 1;
    this.rows.push({ revision, envelope, clientSavedAt: savedAt, createdAt: this.clock() });
    if (this.rows.length > MAX_ROWS) this.rows.shift();
    return revision;
  }

  private guard(): void {
    if (this.offline) throw new CloudError('offline');
  }
}
