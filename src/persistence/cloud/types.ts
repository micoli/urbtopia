export type CloudErrorKind = 'offline' | 'rate-limited' | 'invalid-code' | 'conflict' | 'too-large' | 'city-limit' | 'unauthenticated' | 'unknown';

export class CloudError extends Error {
  constructor(
    readonly kind: CloudErrorKind,
    readonly serverRevision: number | null = null,
  ) {
    super(`cloud-${kind}`);
  }
}

export interface CloudSave {
  revision: number;
  envelope: string;
  clientSavedAt: number;
}

export interface CloudSaveVersion {
  revision: number;
  clientSavedAt: number;
  createdAt: number;
}

export interface CloudCity {
  cityId: string;
  revision: number;
  clientSavedAt: number;
}

export interface PushInput {
  cityId: string;
  baseRevision: number;
  envelope: string;
  savedAt: number;
  formatVersion: number;
  keepPrevious?: boolean;
  keepalive?: boolean;
}

export interface CloudAccount {
  userId: string;
  email: string | null;
}

export interface CloudSaveClient {
  signIn(): Promise<void>;
  signInWithPassword(email: string, password: string): Promise<void>;
  account(): Promise<CloudAccount | null>;
  sendEmailCode(email: string): Promise<void>;
  verifyEmailCode(email: string, code: string): Promise<void>;
  onAccountChange(listener: (account: CloudAccount | null) => void): () => void;
  push(input: PushInput): Promise<number>;
  latest(cityId: string): Promise<CloudSave | null>;
  list(cityId: string): Promise<CloudSaveVersion[]>;
  listCities(): Promise<CloudCity[]>;
  restore(cityId: string, revision: number): Promise<number>;
  deleteCity(cityId: string): Promise<void>;
  deleteMine(): Promise<void>;
  signOut(): Promise<void>;
}
