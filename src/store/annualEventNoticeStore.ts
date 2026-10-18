import { createStore } from 'zustand/vanilla';

export const ANNUAL_EVENT_NOTICES_KEY = 'urbtopia-annual-event-notices';

// One notice is told apart by its event and the year of the event's anchor date: "halloween:2026".
export const noticeKeyOf = (eventId: string, year: number): string => `${eventId}:${year}`;

export function parseDismissedNotices(raw: string | null): string[] {
  if (raw === null) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((key): key is string => typeof key === 'string' && /^[A-Za-z]+:\d+$/.test(key)) : [];
  } catch {
    return [];
  }
}

function readStored(): string | null {
  try {
    return localStorage.getItem(ANNUAL_EVENT_NOTICES_KEY);
  } catch {
    return null;
  }
}

function writeStored(dismissed: readonly string[]): void {
  try {
    localStorage.setItem(ANNUAL_EVENT_NOTICES_KEY, JSON.stringify(dismissed));
  } catch {
    // A notice is a convenience: it comes back next time when the browser cannot keep the dismissal.
  }
}

export interface AnnualEventNoticeStore {
  dismissed: readonly string[];
  dismiss: (key: string) => void;
}

export const annualEventNoticeStore = createStore<AnnualEventNoticeStore>((set, get) => ({
  dismissed: parseDismissedNotices(readStored()),
  dismiss: (key) => {
    if (get().dismissed.includes(key)) return;
    const dismissed = [...get().dismissed, key];
    set({ dismissed });
    writeStored(dismissed);
  },
}));
