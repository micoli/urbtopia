import { createStore } from 'zustand/vanilla';
import { BugReportError, type BugReportClient, type BugReportSummary, type BugReportThread } from './types';

export interface BugReportInboxStore {
  open: boolean;
  reports: BugReportSummary[];
  unread: number;
  thread: BugReportThread | null;
  failed: BugReportError | null;
  busy: boolean;
  refresh: () => Promise<void>;
  openInbox: () => void;
  closeInbox: () => void;
  openThread: (id: number) => Promise<void>;
  backToList: () => void;
  reply: (body: string) => Promise<boolean>;
}

export function createBugReportInboxStore(getClient: () => Promise<BugReportClient | null>) {
  return createStore<BugReportInboxStore>((set, get) => {
    const run = async <T>(work: (client: BugReportClient) => Promise<T>): Promise<T | null> => {
      set({ busy: true, failed: null });
      try {
        const client = await getClient();
        if (!client) throw new BugReportError('unknown');
        return await work(client);
      } catch (error) {
        set({ failed: error instanceof BugReportError ? error : new BugReportError('unknown') });
        return null;
      } finally {
        set({ busy: false });
      }
    };
    const load = async () => {
      const reports = await run((client) => client.list());
      if (reports) set({ reports, unread: reports.filter((report) => report.unread).length });
    };
    return {
      open: false,
      reports: [],
      unread: 0,
      thread: null,
      failed: null,
      busy: false,
      refresh: load,
      openInbox: () => {
        set({ open: true, thread: null });
        void load();
      },
      closeInbox: () => set({ open: false, thread: null, failed: null }),
      openThread: async (id) => {
        const thread = await run((client) => client.get(id));
        if (!thread) return;
        set({ thread });
        await load();
      },
      backToList: () => set({ thread: null, failed: null }),
      reply: async (body) => {
        const current = get().thread;
        if (!current) return false;
        const sent = await run(async (client) => {
          await client.reply(current.id, body);
          return client.get(current.id);
        });
        if (!sent) return false;
        set({ thread: sent });
        return true;
      },
    };
  });
}
