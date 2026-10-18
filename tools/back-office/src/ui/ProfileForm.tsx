import { useState, type FormEvent } from 'react'
import { DEFAULT_GAME_URL, DEFAULT_URL, profileProblem, type Profile } from '../domain/profiles'
import { ColorPicker } from './ColorPicker'
import { button, input } from './styles'

interface Props {
  initial: Profile
  submitLabel: string
  onSubmit: (profile: Profile) => void
  onCancel?: () => void
}

export function ProfileForm({ initial, submitLabel, onSubmit, onCancel }: Props) {
  const [profile, setProfile] = useState(initial)
  const [problem, setProblem] = useState<string | null>(null)
  const change = (patch: Partial<Profile>) => setProfile(current => ({ ...current, ...patch }))

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const found = profileProblem(profile)
    setProblem(found)
    if (!found) onSubmit(profile)
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm font-medium">
        Name
        <input className={input} value={profile.name} onChange={event => change({ name: event.target.value })} placeholder="Local, Production…" autoFocus />
      </label>
      <div className="flex flex-col gap-1 text-sm font-medium">
        Color
        <ColorPicker value={profile.color} onChange={color => change({ color })} />
      </div>
      <label className="flex flex-col gap-1 text-sm font-medium">
        Supabase URL
        <input className={input} value={profile.url} onChange={event => change({ url: event.target.value })} placeholder={DEFAULT_URL} />
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium">
        Service role key
        <input className={input} type="password" value={profile.serviceKey} onChange={event => change({ serviceKey: event.target.value })} autoComplete="off" />
        <span className="text-xs font-normal text-zinc-500">Kept in this browser's local storage only. It bypasses row-level security: never share this page's origin.</span>
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium">
        Game URL
        <input className={input} value={profile.gameUrl} onChange={event => change({ gameUrl: event.target.value })} placeholder={DEFAULT_GAME_URL} />
        <span className="text-xs font-normal text-zinc-500">Development server of the game, used to open a save.</span>
      </label>
      {problem && <p className="text-sm text-red-700" role="alert">{problem}</p>}
      <div className="flex justify-end gap-2">
        {onCancel && <button type="button" className={button()} onClick={onCancel}>Cancel</button>}
        <button type="submit" className={button('primary')}>{submitLabel}</button>
      </div>
    </form>
  )
}
