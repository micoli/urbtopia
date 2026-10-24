import { createStore } from 'zustand/vanilla';
import { DEFAULT_READER_SETTINGS, readerSettingsOf, searchOf, type ReaderSettings } from './readerSettings';

const SESSION_KEY = 'urbtopia-guide-reader';

export interface ReaderSettingsStore extends ReaderSettings {
  set: (settings: Partial<ReaderSettings>) => void;
}

function remembered(): ReaderSettings | null {
  try {
    return readerSettingsOf(sessionStorage.getItem(SESSION_KEY) ?? '');
  } catch {
    return null;
  }
}

function publish(settings: ReaderSettings): void {
  const search = searchOf(settings);
  history.replaceState(history.state, '', `${location.pathname}${search}${location.hash}`);
  try {
    sessionStorage.setItem(SESSION_KEY, search);
  } catch {
    // The URL still carries the settings.
  }
}

export const readerSettingsStore = createStore<ReaderSettingsStore>((set, get) => ({
  ...DEFAULT_READER_SETTINGS,
  set: (settings) => {
    set(settings);
    const { difficulty, citizens } = get();
    publish({ difficulty, citizens });
  },
}));

export function restoreReaderSettings(): void {
  const settings = readerSettingsOf(location.search) ?? remembered();
  if (settings) readerSettingsStore.getState().set(settings);
}
