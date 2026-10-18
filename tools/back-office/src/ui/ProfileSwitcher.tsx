import { useState } from 'react'
import { DropdownMenu } from 'radix-ui'
import { hostOf, isLocalUrl, newProfile, type Profile } from '../domain/profiles'
import { useProfiles } from '../store/connectionStore'
import { ColorDot } from './ColorDot'
import { ConfirmDialog } from './ConfirmDialog'
import { ProfileDialog } from './ProfileDialog'
import { badge, button } from './styles'

interface Props {
  active: Profile
}

type Dialog = { kind: 'add'; profile: Profile } | { kind: 'edit'; profile: Profile } | { kind: 'remove'; profile: Profile }

const item = 'flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm outline-none data-[highlighted]:bg-zinc-100'

export function ProfileSwitcher({ active }: Props) {
  const { profiles, save, remove, select } = useProfiles()
  const [dialog, setDialog] = useState<Dialog | null>(null)

  return (
    <>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger className={button('secondary')}>
          <ColorDot color={active.color} />
          {active.name}
          <span className={badge(isLocalUrl(active.url) ? 'green' : 'red')}>{isLocalUrl(active.url) ? 'Local' : 'Remote'}</span>
          <span aria-hidden>▾</span>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content align="start" sideOffset={6} className="z-30 min-w-64 rounded-lg bg-white p-1 shadow-lg ring-1 ring-zinc-200">
            {profiles.map(profile => (
              <DropdownMenu.Item key={profile.id} className={item} onSelect={() => select(profile.id)}>
                <ColorDot color={profile.color} />
                <span className="flex-1 truncate">{profile.name}</span>
                <span className="truncate text-xs text-zinc-500">{hostOf(profile.url)}</span>
                {profile.id === active.id && <span aria-label="Active">✓</span>}
              </DropdownMenu.Item>
            ))}
            <DropdownMenu.Separator className="my-1 h-px bg-zinc-200" />
            <DropdownMenu.Item className={item} onSelect={() => setDialog({ kind: 'add', profile: newProfile(crypto.randomUUID()) })}>＋ Add a project</DropdownMenu.Item>
            <DropdownMenu.Item className={item} onSelect={() => setDialog({ kind: 'edit', profile: active })}>✎ Edit “{active.name}”</DropdownMenu.Item>
            <DropdownMenu.Item className={`${item} text-red-600`} onSelect={() => setDialog({ kind: 'remove', profile: active })}>✕ Remove “{active.name}”</DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
      {dialog && dialog.kind !== 'remove' && (
        <ProfileDialog
          title={dialog.kind === 'add' ? 'Add a project' : 'Edit project'}
          initial={dialog.profile}
          onCancel={() => setDialog(null)}
          onSubmit={profile => {
            save(profile)
            setDialog(null)
          }}
        />
      )}
      {dialog?.kind === 'remove' && (
        <ConfirmDialog
          title={`Remove “${dialog.profile.name}”`}
          message="Its URL and service key are erased from this browser. The project itself is untouched."
          confirm="Remove"
          onCancel={() => setDialog(null)}
          onConfirm={() => {
            remove(dialog.profile.id)
            setDialog(null)
          }}
        />
      )}
    </>
  )
}
