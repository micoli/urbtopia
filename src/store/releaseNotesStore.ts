import { createStore } from 'zustand/vanilla';
import { fetchReleases } from '../releaseNotes/githubReleases';
import type { PublishedRelease } from '../releaseNotes/releaseNote';

export const RELEASE_NOTES_SEEN_KEY = 'urbtopia-release-notes-seen';

export function parseLastSeenId(raw: string | null): string | null {
  if (raw === null) return null;
  return raw.trim() === '' ? null : raw;
}

function readStored(): string | null {
  try {
    return localStorage.getItem(RELEASE_NOTES_SEEN_KEY);
  } catch {
    return null;
  }
}

function writeStored(id: string): void {
  try {
    localStorage.setItem(RELEASE_NOTES_SEEN_KEY, id);
  } catch {
    // The window is a convenience: it comes back next time when the browser cannot keep what was seen.
  }
}

function removeStored(): void {
  try {
    localStorage.removeItem(RELEASE_NOTES_SEEN_KEY);
  } catch {
    // Nothing to forget when the browser keeps nothing.
  }
}

export interface ReleaseNotesStore {
  releases: readonly PublishedRelease[];
  loadStarted: boolean;
  // The tag of the newest release whose note the player has read. Null in a browser that never stored one.
  lastSeenId: string | null;
  reviewing: boolean;
  load: (fetchImpl?: typeof fetch) => Promise<void>;
  markSeen: (id: string) => void;
  forgetLastSeen: () => void;
  setReviewing: (reviewing: boolean) => void;
}

export const releaseNotesStore = createStore<ReleaseNotesStore>((set, get) => ({
  releases: [],
  loadStarted: false,
  lastSeenId: parseLastSeenId(readStored()),
  reviewing: false,
  load: async (fetchImpl) => {
    if (get().loadStarted) return;
    set({ loadStarted: true });
    const releases = await fetchReleases(fetchImpl);
    set({ releases });
    // A browser that never stored anything starts on the latest release: a new player is not told about what they never lacked.
    const latest = releases[0];
    if (get().lastSeenId === null && latest) get().markSeen(latest.id);
  },
  markSeen: (id) => {
    set({ lastSeenId: id });
    writeStored(id);
  },
  // Starts over as a player who read nothing: the window opens again with the latest notes.
  forgetLastSeen: () => {
    removeStored();
    set({ lastSeenId: get().releases.at(-1)?.id ?? null });
  },
  setReviewing: (reviewing) => set({ reviewing }),
}));
