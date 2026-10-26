import { FIRST_CITY_ID, MAX_CITIES } from '../cities';
import { CloudError, type CloudAccount, type CloudCity, type CloudSave, type CloudSaveClient, type CloudSaveVersion, type PushInput } from './types';

const MAX_ROWS = 10;
const MAX_ENVELOPE_LENGTH = 1_048_576;

interface Row extends CloudSave {
  createdAt: number;
}

export class FakeCloudSaveClient implements CloudSaveClient {
  private users = new Map<string, Map<string, Row[]>>();
  private userId = 'user-1';
  private nextUser = 2;
  emails = new Map<string, string>();
  private passwords = new Map<string, string>();
  sentCodes: string[] = [];
  validCode = '123456';
  private listeners = new Set<(account: CloudAccount | null) => void>();
  pushes: PushInput[] = [];
  signedIn = false;
  private offline = false;
  private hourMs = 3_600_000;

  constructor(private clock: () => number = () => 0) {}

  get rows(): Row[] {
    return this.rowsOf(FIRST_CITY_ID);
  }

  set rows(value: Row[]) {
    this.cities().set(FIRST_CITY_ID, value);
  }

  rowsOf(cityId: string): Row[] {
    const cities = this.cities();
    let rows = cities.get(cityId);
    if (!rows) {
      rows = [];
      cities.set(cityId, rows);
    }
    return rows;
  }

  private cities(): Map<string, Row[]> {
    let cities = this.users.get(this.userId);
    if (!cities) {
      cities = new Map();
      this.users.set(this.userId, cities);
    }
    return cities;
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

  seed(envelope: string, savedAt: number, cityId: string = FIRST_CITY_ID): number {
    return this.insert(cityId, envelope, savedAt, 0);
  }

  async signIn(): Promise<void> {
    this.guard();
    this.signedIn = true;
  }

  async signInWithPassword(email: string, password: string): Promise<void> {
    this.guard();
    const known = [...this.emails].find(([, known]) => known === email);
    const stored = this.passwords.get(email);
    if (stored !== undefined && stored !== password) throw new CloudError('unknown');
    this.passwords.set(email, password);
    this.userId = known ? known[0] : `user-${this.nextUser++}`;
    this.emails.set(this.userId, email);
    this.signedIn = true;
    this.emitAccount();
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

  async sendEmailCode(email: string): Promise<void> {
    this.guard();
    this.sentCodes.push(email);
  }

  async verifyEmailCode(email: string, code: string): Promise<void> {
    this.guard();
    if (code.trim() !== this.validCode) throw new CloudError('invalid-code');
    this.emails.set(this.userId, email);
    this.emitAccount();
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
    const current = this.current(input.cityId);
    const currentRevision = current?.revision ?? 0;
    if (!current && this.storedCityCount() >= MAX_CITIES) throw new CloudError('city-limit');
    if (input.baseRevision !== currentRevision) throw new CloudError('conflict', currentRevision);
    const sameHour = current && this.clock() - current.createdAt < this.hourMs;
    if (current && sameHour && !input.keepPrevious) {
      current.revision += 1;
      current.envelope = input.envelope;
      current.clientSavedAt = input.savedAt;
      return current.revision;
    }
    return this.insert(input.cityId, input.envelope, input.savedAt, currentRevision);
  }

  async latest(cityId: string): Promise<CloudSave | null> {
    this.guard();
    const current = this.current(cityId);
    return current ? { revision: current.revision, envelope: current.envelope, clientSavedAt: current.clientSavedAt } : null;
  }

  async list(cityId: string): Promise<CloudSaveVersion[]> {
    this.guard();
    return [...this.rowsOf(cityId)].reverse().map((row) => ({ revision: row.revision, clientSavedAt: row.clientSavedAt, createdAt: row.createdAt }));
  }

  async listCities(): Promise<CloudCity[]> {
    this.guard();
    return [...this.cities()].flatMap(([cityId, rows]) => {
      const latest = rows[rows.length - 1];
      return latest ? [{ cityId, revision: latest.revision, clientSavedAt: latest.clientSavedAt }] : [];
    });
  }

  async restore(cityId: string, revision: number): Promise<number> {
    this.guard();
    const source = this.rowsOf(cityId).find((row) => row.revision === revision);
    if (!source) throw new CloudError('unknown');
    return this.insert(cityId, source.envelope, source.clientSavedAt, this.current(cityId)?.revision ?? 0);
  }

  async deleteCity(cityId: string): Promise<void> {
    this.guard();
    this.cities().delete(cityId);
  }

  async deleteMine(): Promise<void> {
    this.guard();
    this.cities().clear();
  }

  private storedCityCount(): number {
    return [...this.cities().values()].filter((rows) => rows.length > 0).length;
  }

  private current(cityId: string): Row | undefined {
    const rows = this.rowsOf(cityId);
    return rows[rows.length - 1];
  }

  private insert(cityId: string, envelope: string, savedAt: number, previousRevision: number): number {
    const rows = this.rowsOf(cityId);
    const revision = previousRevision + 1;
    rows.push({ revision, envelope, clientSavedAt: savedAt, createdAt: this.clock() });
    if (rows.length > MAX_ROWS) rows.shift();
    return revision;
  }

  private guard(): void {
    if (this.offline) throw new CloudError('offline');
  }
}
