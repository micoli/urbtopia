export interface ConfirmKeyEvent {
  key: string;
  repeat: boolean;
  typing: boolean;
}

export type ConfirmKeyAction = 'confirm' | 'cancel' | 'rotate';

export function confirmKeyAction({ key, repeat, typing }: ConfirmKeyEvent, canConfirm: boolean, canRotate = false): ConfirmKeyAction | null {
  if (repeat || typing) return null;
  if (key === 'Escape') return 'cancel';
  if (key === 'Enter' && canConfirm) return 'confirm';
  if (key.toLowerCase() === 'r' && canRotate) return 'rotate';
  return null;
}
