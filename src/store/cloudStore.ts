import { createStore } from 'zustand/vanilla';
import type { CloudStatus, SaveConflictChoice } from '../persistence/cloud/cloudSync';
import type { CloudAccount, CloudSaveVersion } from '../persistence/cloud/types';

export type EmailCodeState =
  | { kind: 'idle' }
  | { kind: 'sending' }
  | { kind: 'error'; reason: 'invalid-email' | 'rate-limited' | 'failed' }
  | { kind: 'sent'; email: string; error?: 'invalid-code' | 'rate-limited' | 'failed' }
  | { kind: 'verifying'; email: string };

export interface EmailCodeActions {
  send: (email: string) => void;
  verify: (code: string) => void;
  cancel: () => void;
}

export interface CloudActions {
  sendEmailCode: (email: string) => Promise<void>;
  verifyEmailCode: (code: string) => Promise<void>;
  cancelEmailCode: () => void;
  signOut: () => Promise<void>;
  syncNow: () => Promise<void>;
  resolveConflict: (choice: SaveConflictChoice) => Promise<void>;
  loadVersions: () => Promise<void>;
  restoreVersion: (revision: number) => Promise<void>;
  deleteCloudData: () => Promise<void>;
  deleteCity: (cityId: string) => Promise<boolean>;
}

export interface CloudStore {
  enabled: boolean;
  status: CloudStatus;
  versions: CloudSaveVersion[] | null;
  account: CloudAccount | null;
  emailCode: EmailCodeState;
  actions: CloudActions | null;
  enable: (actions: CloudActions) => void;
  setStatus: (status: CloudStatus) => void;
  setVersions: (versions: CloudSaveVersion[] | null) => void;
  setAccount: (account: CloudAccount | null) => void;
  setEmailCode: (emailCode: EmailCodeState) => void;
}

export const cloudStore = createStore<CloudStore>((set) => ({
  enabled: false,
  status: { kind: 'idle' },
  versions: null,
  account: null,
  emailCode: { kind: 'idle' },
  actions: null,
  enable: (actions) => set({ enabled: true, actions }),
  setStatus: (status) => set({ status }),
  setVersions: (versions) => set({ versions }),
  setAccount: (account) => set({ account }),
  setEmailCode: (emailCode) => set({ emailCode }),
}));
