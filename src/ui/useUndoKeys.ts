import { useEffect } from 'react';
import { gameStore } from '../store/gameStore';
import { readOnlyStore } from '../store/readOnlyStore';
import { uiStore } from '../store/uiStore';
import { dialogStore } from '../store/dialogStore';

export function useUndoKeys(): void {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== 'z' || !(event.ctrlKey || event.metaKey) || event.shiftKey || event.altKey || event.repeat) return;
      if (window.matchMedia('(pointer: coarse)').matches) return;
      const target = event.target;
      if (target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))) return;
      const dialogs = dialogStore.getState();
      if (dialogs.pendingImport || dialogs.recovery || dialogs.saveFailed || uiStore.getState().statsOpen || uiStore.getState().codexOpen || uiStore.getState().pendingSaleId !== null) return;
      if (readOnlyStore.getState().readOnly || !gameStore.getState().deletionUndo) return;
      event.preventDefault();
      gameStore.getState().undo();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);
}
