import { useEffect } from 'react';
import { confirmKeyAction } from './confirmKeys';

interface ConfirmKeys {
  active: boolean;
  canConfirm?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

function isTyping(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
}

export function useConfirmKeys({ active, canConfirm = true, onConfirm, onCancel }: ConfirmKeys): void {
  useEffect(() => {
    if (!active) return;
    const onKeyDown = (event: KeyboardEvent) => {
      const action = confirmKeyAction({ key: event.key, repeat: event.repeat, typing: isTyping(event.target) }, canConfirm);
      if (!action) return;
      event.preventDefault();
      event.stopPropagation();
      if (action === 'confirm') return onConfirm();
      onCancel();
    };
    window.addEventListener('keydown', onKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', onKeyDown, { capture: true });
  }, [active, canConfirm, onConfirm, onCancel]);
}
