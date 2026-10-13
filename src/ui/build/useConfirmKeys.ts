import { useEffect } from 'react';
import { isTypingTarget } from '../../dom/isTypingTarget';
import { confirmKeyAction } from './confirmKeys';

interface ConfirmKeys {
  active: boolean;
  canConfirm?: boolean;
  canRotate?: boolean;
  onConfirm: () => void;
  onRotate?: () => void;
  onCancel: () => void;
}

export function useConfirmKeys({ active, canConfirm = true, canRotate = false, onConfirm, onRotate = () => {}, onCancel }: ConfirmKeys): void {
  useEffect(() => {
    if (!active) return;
    const onKeyDown = (event: KeyboardEvent) => {
      const action = confirmKeyAction({ key: event.key, repeat: event.repeat, typing: isTypingTarget(event.target) }, canConfirm, canRotate);
      if (!action) return;
      event.preventDefault();
      event.stopPropagation();
      if (action === 'confirm') return onConfirm();
      if (action === 'rotate') return onRotate();
      onCancel();
    };
    window.addEventListener('keydown', onKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', onKeyDown, { capture: true });
  }, [active, canConfirm, canRotate, onConfirm, onRotate, onCancel]);
}
