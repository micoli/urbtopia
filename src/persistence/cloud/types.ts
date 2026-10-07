export type CloudErrorKind = 'offline' | 'conflict' | 'too-large' | 'unauthenticated' | 'unknown';

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

export interface PushInput {
  baseRevision: number;
  envelope: string;
  savedAt: number;
  formatVersion: number;
  keepPrevious?: boolean;
  keepalive?: boolean;
}

export interface CloudSaveClient {
  signIn(): Promise<void>;
  push(input: PushInput): Promise<number>;
  latest(): Promise<CloudSave | null>;
  list(): Promise<CloudSaveVersion[]>;
  restore(revision: number): Promise<number>;
  deleteMine(): Promise<void>;
  signOut(): Promise<void>;
}
