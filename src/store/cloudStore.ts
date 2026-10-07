import { createStore } from 'zustand/vanilla';
import type { CloudStatus, SaveConflictChoice } from '../persistence/cloud/cloudSync';
import type { CloudAccount, CloudSaveVersion } from '../persistence/cloud/types';

export type EmailLinkState = { kind: 'idle' } | { kind: 'sending' } | { kind: 'sent'; email: string } | { kind: 'error'; reason: 'invalid-email' | 'rate-limited' | 'failed' };

export interface CloudActions {
  sendEmailLink: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  syncNow: () => Promise<void>;
  resolveConflict: (choice: SaveConflictChoice) => Promise<void>;
  loadVersions: () => Promise<void>;
  restoreVersion: (revision: number) => Promise<void>;
  deleteCloudData: () => Promise<void>;
}

export interface CloudStore {
  enabled: boolean;
  status: CloudStatus;
  versions: CloudSaveVersion[] | null;
  account: CloudAccount | null;
  emailLink: EmailLinkState;
  actions: CloudActions | null;
  enable: (actions: CloudActions) => void;
  setStatus: (status: CloudStatus) => void;
  setVersions: (versions: CloudSaveVersion[] | null) => void;
  setAccount: (account: CloudAccount | null) => void;
  setEmailLink: (emailLink: EmailLinkState) => void;
}

export const cloudStore = createStore<CloudStore>((set) => ({
  enabled: false,
  status: { kind: 'idle' },
  versions: null,
  account: null,
  emailLink: { kind: 'idle' },
  actions: null,
  enable: (actions) => set({ enabled: true, actions }),
  setStatus: (status) => set({ status }),
  setVersions: (versions) => set({ versions }),
  setAccount: (account) => set({ account }),
  setEmailLink: (emailLink) => set({ emailLink }),
}));
