import { AlertDialog } from 'radix-ui'

interface Props {
  assetKey: string
  onConfirm: () => void
}

export function ConfirmDeleteDialog({ assetKey, onConfirm }: Props) {
  return (
    <AlertDialog.Root>
      <AlertDialog.Trigger asChild>
        <button>delete this asset</button>
      </AlertDialog.Trigger>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="dialog-overlay" />
        <AlertDialog.Content className="dialog-content">
          <AlertDialog.Title>Delete {assetKey}?</AlertDialog.Title>
          <AlertDialog.Description>The file is removed from assets/ and its definition from models.json.</AlertDialog.Description>
          <div className="dialog-actions">
            <AlertDialog.Cancel asChild>
              <button>cancel</button>
            </AlertDialog.Cancel>
            <AlertDialog.Action asChild>
              <button onClick={onConfirm}>delete</button>
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  )
}
