import { createStore } from 'zustand/vanilla';
import { prefsStore } from '../i18n/prefsStore';
import type { AdvisorEngine, AdvisorErrorKind } from './AdvisorEngine';
import { classifyAdvisorFailure } from './classifyAdvisorFailure';
import { advisorEngine } from './currentAdvisorEngine';

export type AdvisorPhase = 'idle' | 'confirming' | 'downloading' | 'loading' | 'ready';

export interface AdvisorStore {
  phase: AdvisorPhase;
  progress: number;
  error: AdvisorErrorKind | null;
  windowOpen: boolean;
  pendingQuestion: string | null;
  openWindow: (question?: string) => void;
  closeWindow: () => void;
  takePendingQuestion: () => string | null;
  requestEnable: () => void;
  cancelEnable: () => void;
  confirmEnable: () => Promise<void>;
  ensureLoaded: () => Promise<void>;
  deleteModel: () => Promise<void>;
}

const IDLE = { phase: 'idle', progress: 0 } as const;

export const advisorStore = createStore<AdvisorStore>((set, get) => {
  const engine = (): AdvisorEngine => advisorEngine();

  async function load(phase: 'downloading' | 'loading'): Promise<boolean> {
    set({ phase, progress: 0, error: null });
    try {
      await engine().load((progress) => set({ progress }));
      set({ phase: 'ready', progress: 1 });
      return true;
    } catch (failure) {
      set({ ...IDLE, error: classifyAdvisorFailure(failure).kind });
      return false;
    }
  }

  return {
    ...IDLE,
    error: null,
    windowOpen: false,
    pendingQuestion: null,
    openWindow: (question) => set({ windowOpen: true, pendingQuestion: question ?? null }),
    closeWindow: () => set({ windowOpen: false, pendingQuestion: null }),
    takePendingQuestion: () => {
      const { pendingQuestion } = get();
      set({ pendingQuestion: null });
      return pendingQuestion;
    },
    requestEnable: () => {
      if (!engine().isSupported()) {
        set({ error: 'unsupported' });
        return;
      }
      set({ phase: 'confirming', error: null });
    },
    cancelEnable: () => set({ ...IDLE }),
    confirmEnable: async () => {
      if (get().phase !== 'confirming') return;
      const loaded = await load('downloading');
      prefsStore.getState().setAdvisor(loaded);
    },
    ensureLoaded: async () => {
      if (get().phase !== 'idle' || !prefsStore.getState().advisor) return;
      const loaded = await load('loading');
      if (!loaded) prefsStore.getState().setAdvisor(false);
    },
    deleteModel: async () => {
      prefsStore.getState().setAdvisor(false);
      set({ ...IDLE, error: null });
      try {
        await engine().deleteModel();
      } catch (failure) {
        set({ error: classifyAdvisorFailure(failure).kind });
      }
    },
  };
});

export function isAdvisorSupported(): boolean {
  return advisorEngine().isSupported();
}
