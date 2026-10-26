import { useEffect } from 'react';
import { isTypingTarget } from '../../dom/isTypingTarget';
import { gameStore } from '../../store/gameStore';
import { readOnlyStore } from '../../store/readOnlyStore';
import { uiStore } from '../../store/uiStore';
import { dialogStore } from '../../store/dialogStore';

export function useUndoKeys(): void {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== 'z' || !(event.ctrlKey || event.metaKey) || event.shiftKey || event.altKey || event.repeat) return;
      if (window.matchMedia('(pointer: coarse)').matches) return;
      if (isTypingTarget(event.target)) return;
      const dialogs = dialogStore.getState();
      if (dialogs.recovery || dialogs.saveFailed || uiStore.getState().statsOpen || uiStore.getState().codexOpen || uiStore.getState().pendingSaleId !== null) return;
      if (readOnlyStore.getState().readOnly || !gameStore.getState().deletionUndo) return;
      event.preventDefault();
      gameStore.getState().undo();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);
}
