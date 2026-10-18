import { Dialog } from 'radix-ui'
import type { Profile } from '../domain/profiles'
import { dialogOverlay } from './styles'
import { ProfileForm } from './ProfileForm'

interface Props {
  title: string
  initial: Profile
  onSubmit: (profile: Profile) => void
  onCancel: () => void
}

export function ProfileDialog({ title, initial, onSubmit, onCancel }: Props) {
  return (
    <Dialog.Root open onOpenChange={open => !open && onCancel()}>
      <Dialog.Portal>
        <Dialog.Overlay className={dialogOverlay} />
        <Dialog.Content className="fixed top-1/2 left-1/2 z-50 flex max-h-[92vh] w-[min(30rem,92vw)] -translate-x-1/2 -translate-y-1/2 flex-col gap-4 overflow-y-auto rounded-xl bg-white p-5 shadow-xl ring-1 ring-zinc-200">
          <Dialog.Title className="text-base font-semibold">{title}</Dialog.Title>
          <Dialog.Description className="sr-only">Name, color and connection details of a Supabase project.</Dialog.Description>
          <ProfileForm initial={initial} submitLabel="Save" onSubmit={onSubmit} onCancel={onCancel} />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
