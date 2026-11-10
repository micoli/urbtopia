import { ActionButton } from '../common/ActionButton';
import { Dialog } from '../common/Dialog';

interface ReplanConfirmDialogProps {
  title: string;
  body: string;
  confirmLabel: string;
  keepLabel: string;
  onConfirm: () => void;
  onClose: () => void;
}

export function ReplanConfirmDialog({ title, body, confirmLabel, keepLabel, onConfirm, onClose }: ReplanConfirmDialogProps) {
  return (
    <Dialog role="alertdialog">
      <Dialog.Title>{title}</Dialog.Title>
      <Dialog.Body>
        <p>{body}</p>
      </Dialog.Body>
      <Dialog.Actions>
        <ActionButton onClick={onClose}>{keepLabel}</ActionButton>
        <ActionButton variant="primary" onClick={onConfirm}>{confirmLabel}</ActionButton>
      </Dialog.Actions>
    </Dialog>
  );
}
