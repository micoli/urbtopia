const DEBOUNCE_MS = 2000;
const TICK_MS = 30_000;

export interface Autosave {
  onCommand: () => void;
  onPassiveChange: () => void;
  flush: () => void;
  dispose: () => void;
}

export function createAutosave({ save }: { save: () => void }): Autosave {
  let dirty = false;
  let debounce: ReturnType<typeof setTimeout> | null = null;

  const clearDebounce = () => {
    if (debounce !== null) clearTimeout(debounce);
    debounce = null;
  };

  const flush = () => {
    clearDebounce();
    if (!dirty) return;
    dirty = false;
    save();
  };

  const interval = setInterval(flush, TICK_MS);

  return {
    onCommand: () => {
      dirty = true;
      clearDebounce();
      debounce = setTimeout(flush, DEBOUNCE_MS);
    },
    onPassiveChange: () => {
      dirty = true;
    },
    flush,
    dispose: () => {
      clearDebounce();
      clearInterval(interval);
    },
  };
}
