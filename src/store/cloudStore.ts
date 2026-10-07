import { createStore } from 'zustand/vanilla';
import type { CloudStatus, SaveConflictChoice } from '../persistence/cloud/cloudSync';
import type { CloudSaveVersion } from '../persistence/cloud/types';

export interface CloudActions {
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
  actions: CloudActions | null;
  enable: (actions: CloudActions) => void;
  setStatus: (status: CloudStatus) => void;
  setVersions: (versions: CloudSaveVersion[] | null) => void;
}

export const cloudStore = createStore<CloudStore>((set) => ({
  enabled: false,
  status: { kind: 'idle' },
  versions: null,
  actions: null,
  enable: (actions) => set({ enabled: true, actions }),
  setStatus: (status) => set({ status }),
  setVersions: (versions) => set({ versions }),
}));
