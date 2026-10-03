export interface ConfirmKeyEvent {
  key: string;
  repeat: boolean;
  typing: boolean;
}

export type ConfirmKeyAction = 'confirm' | 'cancel';

export function confirmKeyAction({ key, repeat, typing }: ConfirmKeyEvent, canConfirm: boolean): ConfirmKeyAction | null {
  if (repeat || typing) return null;
  if (key === 'Escape') return 'cancel';
  if (key === 'Enter' && canConfirm) return 'confirm';
  return null;
}
