import { Dialog } from 'radix-ui'
import { button, dialogContent, dialogOverlay } from './styles'

interface Props {
  title: string
  message: string
  confirm: string
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({ title, message, confirm, onConfirm, onCancel }: Props) {
  return (
    <Dialog.Root open onOpenChange={open => !open && onCancel()}>
      <Dialog.Portal>
        <Dialog.Overlay className={dialogOverlay} />
        <Dialog.Content className={dialogContent}>
          <Dialog.Title className="text-base font-semibold">{title}</Dialog.Title>
          <Dialog.Description className="text-sm text-zinc-600">{message}</Dialog.Description>
          <div className="flex justify-end gap-2">
            <button className={button()} onClick={onCancel}>Cancel</button>
            <button className={button('danger')} onClick={onConfirm}>{confirm}</button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
