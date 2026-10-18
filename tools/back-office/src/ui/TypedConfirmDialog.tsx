import { useState } from 'react'
import { Dialog } from 'radix-ui'
import { button, dialogContent, dialogOverlay, input } from './styles'

interface Props {
  title: string
  message: string
  expected: string
  confirm: string
  onConfirm: () => void
  onCancel: () => void
}

export function TypedConfirmDialog({ title, message, expected, confirm, onConfirm, onCancel }: Props) {
  const [typed, setTyped] = useState('')

  return (
    <Dialog.Root open onOpenChange={open => !open && onCancel()}>
      <Dialog.Portal>
        <Dialog.Overlay className={dialogOverlay} />
        <Dialog.Content className={dialogContent}>
          <Dialog.Title className="text-base font-semibold">{title}</Dialog.Title>
          <Dialog.Description className="text-sm text-zinc-600">{message}</Dialog.Description>
          <label className="flex flex-col gap-1 text-sm">
            Type <code className="font-semibold">{expected}</code> to confirm
            <input className={input} value={typed} onChange={event => setTyped(event.target.value)} autoFocus />
          </label>
          <div className="flex justify-end gap-2">
            <button className={button()} onClick={onCancel}>Cancel</button>
            <button className={button('danger')} onClick={onConfirm} disabled={typed !== expected}>{confirm}</button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
