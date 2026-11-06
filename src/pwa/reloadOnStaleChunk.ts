const LAST_RELOAD_KEY = 'urbtopia-stale-chunk-reload';
const RELOAD_COOLDOWN_MS = 60 * 1000;

interface StaleChunkDeps {
  now: () => number;
  read: () => string | null;
  write: (value: string) => void;
  reload: () => void;
}

const browserDeps: StaleChunkDeps = {
  now: () => Date.now(),
  read: () => {
    try {
      return sessionStorage.getItem(LAST_RELOAD_KEY);
    } catch {
      return null;
    }
  },
  write: (value) => {
    try {
      sessionStorage.setItem(LAST_RELOAD_KEY, value);
    } catch {
      // Without storage the cooldown cannot be remembered; the reload still happens once per page load.
    }
  },
  reload: () => window.location.reload(),
};

const CHUNK_ERROR_PATTERN = /dynamically imported module|importing a module script failed|error loading dynamically imported module|failed to fetch/i;

export function isChunkLoadError(error: unknown): boolean {
  return error instanceof Error && CHUNK_ERROR_PATTERN.test(error.message);
}

// A tab opened before a deploy asks for chunks that no longer exist. A reload fetches the new build;
// the cooldown stops a reload loop when the chunk is missing for another reason.
export function reloadOnceForStaleChunk(deps: StaleChunkDeps = browserDeps): boolean {
  const lastReload = Number(deps.read());
  const now = deps.now();
  if (lastReload && now - lastReload < RELOAD_COOLDOWN_MS) return false;
  deps.write(String(now));
  deps.reload();
  return true;
}

export function installStaleChunkReload(): void {
  window.addEventListener('vite:preloadError', (event) => {
    event.preventDefault();
    reloadOnceForStaleChunk();
  });
}
